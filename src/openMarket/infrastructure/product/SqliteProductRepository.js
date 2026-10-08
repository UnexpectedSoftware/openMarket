import ProductRepository from "../../domain/product/ProductRepository";
import * as Rx from "rxjs";
import ProductStatus from "../../domain/product/ProductStatus";

const PRODUCT_SELECT = 'SELECT p.barcode, p.name, p.description, p.stock_min, p.price, p.stock, p.base_price, p.status, p.weighted, p.image_name, ' +
  'p.category_id as category_id, c.name as category_name ' +
  'FROM product p LEFT JOIN category c ON c.id = p.category_id';

const ORDER_ENABLED_FIRST = ' ORDER BY CASE WHEN p.status = ? THEN 0 ELSE 1 END, p.barcode';

function sqlValue(value) {
  return value === undefined ? null : value;
}

function bit(value) {
  if (value == null) {
    return null;
  }
  return value ? 1 : 0;
}

const NAME_KEY = "COALESCE(p.name, '')";
const STOCK_MISSING = '(p.stock IS NULL)';

function likeContains(text) {
  return '%' + text.replace(/[\\%_]/g, (char) => '\\' + char) + '%';
}

function catalogSort(sort) {
  if (sort === 'name_asc' || sort === 'name_desc' || sort === 'stock_asc' || sort === 'stock_desc') {
    return sort;
  }
  return 'name_asc';
}

function catalogCursor(after) {
  if (after == null) {
    return null;
  }
  if (typeof after.barcode !== 'string' || after.barcode === '' || typeof after.name !== 'string') {
    throw new Error('Invalid product page');
  }
  if (after.stock == null) {
    return {name: after.name, stock: null, barcode: after.barcode};
  }
  const stock = Number(after.stock);
  if (!Number.isFinite(stock)) {
    throw new Error('Invalid product page');
  }
  return {name: after.name, stock, barcode: after.barcode};
}

function catalogOrder(sort) {
  if (sort === 'name_desc') {
    return NAME_KEY + ' COLLATE NOCASE DESC, p.barcode ASC';
  }
  if (sort === 'stock_asc') {
    return STOCK_MISSING + ' ASC, p.stock ASC, p.barcode ASC';
  }
  if (sort === 'stock_desc') {
    return STOCK_MISSING + ' ASC, p.stock DESC, p.barcode ASC';
  }
  return NAME_KEY + ' COLLATE NOCASE ASC, p.barcode ASC';
}

function catalogAfter(sort, cursor) {
  if (cursor == null) {
    return {sql: '', params: []};
  }
  if (sort === 'name_asc' || sort === 'name_desc') {
    const direction = sort === 'name_desc' ? '<' : '>';
    return {
      sql: ' AND (' + NAME_KEY + ' COLLATE NOCASE ' + direction + ' ?' +
        ' OR (' + NAME_KEY + ' COLLATE NOCASE = ? AND p.barcode > ?))',
      params: [cursor.name, cursor.name, cursor.barcode]
    };
  }
  const missing = cursor.stock == null ? 1 : 0;
  const direction = sort === 'stock_desc' ? '<' : '>';
  return {
    sql: ' AND (' + STOCK_MISSING + ' > ?' +
      ' OR (' + STOCK_MISSING + ' = ? AND ? = 0 AND (p.stock ' + direction + ' ? OR (p.stock = ? AND p.barcode > ?)))' +
      ' OR (' + STOCK_MISSING + ' = ? AND ? = 1 AND p.barcode > ?))',
    params: [
      missing,
      missing, missing, cursor.stock, cursor.stock, cursor.barcode,
      missing, missing, cursor.barcode
    ]
  };
}

function catalogStatus(status) {
  if (status === ProductStatus.ENABLED || status === ProductStatus.DISABLED) {
    return status;
  }
  return null;
}

function catalogFilterSql({query, lowStock, status, categoryId}) {
  const text = query == null ? '' : String(query).trim();
  const pattern = likeContains(text);
  const category = categoryId ? categoryId : null;
  const selected = catalogStatus(status);
  return {
    where: ' AND (? = 0 OR p.stock <= p.stock_min)' +
      ' AND (? IS NULL OR p.status = ?)' +
      ' AND (? IS NULL OR p.category_id = ?)' +
      ' AND (? = \'\' OR p.name LIKE ? ESCAPE \'\\\' OR p.barcode LIKE ? ESCAPE \'\\\')',
    params: [
      lowStock ? 1 : 0,
      selected, selected,
      category, category,
      text, pattern, pattern
    ]
  };
}

export default class SqliteProductRepository extends ProductRepository {
  constructor({connection, productMapper, images}) {
    super();
    this._database = connection.database;
    this._productMapper = productMapper;
    this._images = images;
  }

  findAll({productFilter}) {
    return this._query(
      PRODUCT_SELECT + ORDER_ENABLED_FIRST + ' LIMIT ? OFFSET ?',
      [ProductStatus.ENABLED, productFilter.limit, productFilter.offset]
    );
  }

  findAllByName({name, limit, offset}) {
    return this._query(
      PRODUCT_SELECT + ' WHERE p.name LIKE ?' + ORDER_ENABLED_FIRST + ' LIMIT ? OFFSET ?',
      ['%' + name + '%', ProductStatus.ENABLED, limit, offset]
    );
  }

  findCatalog({query, lowStock, status, categoryId, sort, after, limit}) {
    return Rx.Observable.defer(() => {
      const size = Number(limit);
      if (!Number.isInteger(size) || size < 1) {
        throw new Error('Invalid product page');
      }
      const order = catalogSort(sort);
      const cursor = catalogCursor(after);
      const pageAfter = catalogAfter(order, cursor);
      const filters = catalogFilterSql({query, lowStock, status, categoryId});
      const sql = PRODUCT_SELECT +
        ' WHERE 1 = 1' +
        pageAfter.sql +
        filters.where +
        ' ORDER BY ' + catalogOrder(order) +
        ' LIMIT ?';
      const params = [
        ...pageAfter.params,
        ...filters.params,
        size + 1
      ];
      const rows = this._database.prepare(sql).all(...params);
      const hasMore = rows.length > size;
      const page = hasMore ? rows.slice(0, size) : rows;
      return Rx.Observable.from(page)
        .flatMap(row => this._productMapper.toDomain({persistenceProduct: row}))
        .toArray()
        .map(products => ({products, hasMore}));
    });
  }

  findAllWithLowStock({limit, offset}) {
    return this._query(
      PRODUCT_SELECT + ' WHERE p.stock <= p.stock_min AND p.status = ? ORDER BY p.barcode LIMIT ? OFFSET ?',
      [ProductStatus.ENABLED, limit, offset]
    );
  }

  save({product, imagePath}) {
    return Rx.Observable.defer(() => {
      const previous = this._database.prepare(
        'SELECT image_name FROM product WHERE barcode = ?'
      ).get(product.barcode);
      const previousName = previous ? previous.image_name : null;
      let imageName = null;
      if (imagePath) {
        imageName = this._images.store({id: product.barcode, sourcePath: imagePath});
      }
      try {
        this._database.prepare(
          'INSERT INTO product (barcode, base_price, category_id, description, name, price, status, stock, stock_min, weighted, image_name) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
          'ON CONFLICT(barcode) DO UPDATE SET base_price=excluded.base_price, category_id=excluded.category_id, ' +
          'description=excluded.description, name=excluded.name, price=excluded.price, status=excluded.status, ' +
          'stock=excluded.stock, stock_min=excluded.stock_min, weighted=excluded.weighted, ' +
          'image_name=COALESCE(excluded.image_name, product.image_name)'
        ).run(
          sqlValue(product.barcode),
          sqlValue(product.basePrice),
          sqlValue(product.category.id),
          sqlValue(product.description),
          sqlValue(product.name),
          sqlValue(product.price),
          sqlValue(product.status),
          sqlValue(product.stock),
          sqlValue(product.stockMin),
          bit(product.isWeighted),
          imageName
        );
      } catch (insertError) {
        if (imageName && imageName !== previousName) {
          this._images.remove(imageName);
        }
        throw insertError;
      }
      if (imageName && previousName && previousName !== imageName) {
        this._images.remove(previousName);
      }
      return Rx.Observable.of(null);
    });
  }

  findByBarcode({barcode}) {
    return Rx.Observable.defer(() => {
      const row = this._database.prepare(PRODUCT_SELECT + ' WHERE p.barcode = ?').get(barcode);
      if (!row) {
        return Rx.Observable.empty();
      }
      return this._productMapper.toDomain({persistenceProduct: row});
    });
  }

  findAllStatuses() {
    const statuses = [];
    for (const [key, value] of Object.entries(ProductStatus)) {
      statuses.push({key, value});
    }
    return Rx.Observable.of(statuses);
  }

  countProducts() {
    return this._count('SELECT count(*) AS total FROM product', []);
  }

  countProductsByName({name}) {
    return this._count(
      'SELECT count(*) AS total FROM product WHERE name LIKE ?',
      ['%' + name + '%']
    );
  }

  countProductsWithLowStock() {
    return this._count(
      'SELECT count(*) AS total FROM product WHERE stock <= stock_min AND status = ?',
      [ProductStatus.ENABLED]
    );
  }

  countCatalog({query, lowStock, status, categoryId}) {
    const filters = catalogFilterSql({query, lowStock, status, categoryId});
    return this._count(
      'SELECT count(*) AS total FROM product p WHERE 1 = 1' + filters.where,
      filters.params
    );
  }

  countWithoutImage() {
    return this._count(
      'SELECT count(*) AS total FROM product ' +
      'WHERE (image_name IS NULL OR image_name = \'\') ' +
      'AND length(barcode) IN (8, 12, 13) ' +
      'AND barcode GLOB \'[0-9]*\' ' +
      'AND barcode NOT GLOB \'*[^0-9]*\'',
      []
    );
  }

  findPage({limit, offset}) {
    const size = Number(limit);
    const start = Number(offset);
    if (!Number.isInteger(size) || size < 1 || !Number.isInteger(start) || start < 0) {
      return Rx.Observable.throw(new Error('Invalid product page'));
    }
    return this._query(
      PRODUCT_SELECT + ' ORDER BY p.barcode LIMIT ? OFFSET ?',
      [size, start]
    );
  }

  updateProduct({barcode, imagePath}) {
    return Rx.Observable.defer(() => {
      const previous = this._database.prepare(
        'SELECT image_name FROM product WHERE barcode = ?'
      ).get(barcode);
      if (!previous) {
        return Rx.Observable.throw(new Error('product not found'));
      }
      const imageName = this._images.store({id: barcode, sourcePath: imagePath});
      try {
        const result = this._database.prepare(
          'UPDATE product SET image_name = ? WHERE barcode = ?'
        ).run(imageName, barcode);
        if (Number(result.changes) === 0) {
          this._images.remove(imageName);
          return Rx.Observable.throw(new Error('product not found'));
        }
      } catch (updateError) {
        if (imageName !== previous.image_name) {
          this._images.remove(imageName);
        }
        return Rx.Observable.throw(updateError);
      }
      if (previous.image_name && previous.image_name !== imageName) {
        this._images.remove(previous.image_name);
      }
      return Rx.Observable.of(null);
    });
  }

  _query(sql, params) {
    return Rx.Observable.defer(() => {
      const rows = this._database.prepare(sql).all(...params);
      return Rx.Observable.from(rows)
        .flatMap(row => this._productMapper.toDomain({persistenceProduct: row}))
        .toArray();
    });
  }

  _count(sql, params) {
    return Rx.Observable.defer(() => {
      const row = this._database.prepare(sql).get(...params);
      return Rx.Observable.of(Number(row.total));
    });
  }
}
