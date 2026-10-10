import ProductRepository from "../../domain/product/ProductRepository";
import * as Rx from "rxjs";
import ProductStatus from "../../domain/product/ProductStatus";

const PRODUCT_SELECT = 'SELECT p.barcode, p.name, p.description, p.stock_min, p.price, p.stock, p.base_price, p.status, p.weighted, p.image_name, ' +
  'p.category_id as category_id, c.name as category_name ' +
  'FROM product p LEFT JOIN category c ON c.id = p.category_id';

const ORDER_ENABLED_FIRST = ' ORDER BY CASE WHEN p.status = ? THEN 0 ELSE 1 END, p.barcode';

const LIMIT_OFFSET_SQL = ' LIMIT ? OFFSET ?';

const FIND_ALL_SQL = PRODUCT_SELECT + ORDER_ENABLED_FIRST + LIMIT_OFFSET_SQL;

const FIND_ALL_BY_NAME_SQL = PRODUCT_SELECT + ' WHERE p.name LIKE ?' + ORDER_ENABLED_FIRST + LIMIT_OFFSET_SQL;

const FIND_ALL_WITH_LOW_STOCK_SQL = PRODUCT_SELECT +
  ' WHERE p.stock <= p.stock_min AND p.status = ? ORDER BY p.barcode LIMIT ? OFFSET ?';

const FIND_CATALOG_SQL = PRODUCT_SELECT + ' WHERE 1 = 1';

const CATALOG_FILTER_SQL = ' AND (? = 0 OR p.stock <= p.stock_min)' +
  ' AND (? IS NULL OR p.status = ?)' +
  ' AND (? IS NULL OR p.category_id = ?)' +
  ' AND (? = \'\' OR p.name LIKE ? ESCAPE \'\\\' OR p.barcode LIKE ? ESCAPE \'\\\')';

const CATALOG_ORDER_BY_SQL = ' ORDER BY ';

const CATALOG_LIMIT_SQL = ' LIMIT ?';

const FIND_BY_BARCODE_SQL = PRODUCT_SELECT + ' WHERE p.barcode = ?';

const FIND_PAGE_SQL = PRODUCT_SELECT + ' ORDER BY p.barcode' + LIMIT_OFFSET_SQL;

const COUNT_PRODUCTS_SQL = 'SELECT count(*) AS total FROM product';

const COUNT_PRODUCTS_BY_NAME_SQL = 'SELECT count(*) AS total FROM product WHERE name LIKE ?';

const COUNT_PRODUCTS_WITH_LOW_STOCK_SQL =
  'SELECT count(*) AS total FROM product WHERE stock <= stock_min AND status = ?';

const COUNT_CATALOG_SQL = 'SELECT count(*) AS total FROM product p WHERE 1 = 1' + CATALOG_FILTER_SQL;

const COUNT_WITHOUT_IMAGE_SQL = 'SELECT count(*) AS total FROM product ' +
  'WHERE (image_name IS NULL OR image_name = \'\') ' +
  'AND length(barcode) IN (8, 12, 13) ' +
  'AND barcode GLOB \'[0-9]*\' ' +
  'AND barcode NOT GLOB \'*[^0-9]*\'';

const SELECT_PRODUCT_IMAGE_SQL = 'SELECT image_name FROM product WHERE barcode = ?';

const UPSERT_PRODUCT_SQL = 'INSERT INTO product (barcode, base_price, category_id, description, name, price, status, stock, stock_min, weighted, image_name) ' +
  'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
  'ON CONFLICT(barcode) DO UPDATE SET base_price=excluded.base_price, category_id=excluded.category_id, ' +
  'description=excluded.description, name=excluded.name, price=excluded.price, status=excluded.status, ' +
  'stock=excluded.stock, stock_min=excluded.stock_min, weighted=excluded.weighted, ' +
  'image_name=COALESCE(excluded.image_name, product.image_name)';

const UPDATE_PRODUCT_IMAGE_SQL = 'UPDATE product SET image_name = ? WHERE barcode = ?';

export default class SqliteProductRepository extends ProductRepository {
  constructor({connection, productMapper, images, queryService}) {
    super();
    this._database = connection.database;
    this._productMapper = productMapper;
    this._images = images;
    this._queryService = queryService;
  }

  findAll({productFilter}) {
    return this._query(
      FIND_ALL_SQL,
      [ProductStatus.ENABLED, productFilter.limit, productFilter.offset]
    );
  }

  findAllByName({name, limit, offset}) {
    return this._query(
      FIND_ALL_BY_NAME_SQL,
      ['%' + name + '%', ProductStatus.ENABLED, limit, offset]
    );
  }

  findCatalog({query, lowStock, status, categoryId, sort, after, limit}) {
    return Rx.Observable.defer(() => {
      const page = this._queryService.catalogPage({
        statement: FIND_CATALOG_SQL,
        filterSql: CATALOG_FILTER_SQL,
        orderBySql: CATALOG_ORDER_BY_SQL,
        limitSql: CATALOG_LIMIT_SQL,
        query,
        lowStock,
        status,
        categoryId,
        sort,
        after,
        limit
      });
      const rows = this._database.prepare(page.sql).all(...page.params);
      const hasMore = rows.length > page.size;
      const visible = hasMore ? rows.slice(0, page.size) : rows;
      return Rx.Observable.from(visible)
        .flatMap(row => this._productMapper.toDomain({persistenceProduct: row}))
        .toArray()
        .map(products => ({products, hasMore}));
    });
  }

  findAllWithLowStock({limit, offset}) {
    return this._query(
      FIND_ALL_WITH_LOW_STOCK_SQL,
      [ProductStatus.ENABLED, limit, offset]
    );
  }

  save({product, imagePath}) {
    return Rx.Observable.defer(() => {
      const previous = this._database.prepare(SELECT_PRODUCT_IMAGE_SQL).get(product.barcode);
      const previousName = previous ? previous.image_name : null;
      let imageName = null;
      if (imagePath) {
        imageName = this._images.store({id: product.barcode, sourcePath: imagePath});
      }
      try {
        this._database.prepare(UPSERT_PRODUCT_SQL).run(
          this._queryService.sqlValue(product.barcode),
          this._queryService.sqlValue(product.basePrice),
          this._queryService.sqlValue(product.category.id),
          this._queryService.sqlValue(product.description),
          this._queryService.sqlValue(product.name),
          this._queryService.sqlValue(product.price),
          this._queryService.sqlValue(product.status),
          this._queryService.sqlValue(product.stock),
          this._queryService.sqlValue(product.stockMin),
          this._queryService.bit(product.isWeighted),
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
      const row = this._database.prepare(FIND_BY_BARCODE_SQL).get(barcode);
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
    return this._count(COUNT_PRODUCTS_SQL, []);
  }

  countProductsByName({name}) {
    return this._count(
      COUNT_PRODUCTS_BY_NAME_SQL,
      ['%' + name + '%']
    );
  }

  countProductsWithLowStock() {
    return this._count(
      COUNT_PRODUCTS_WITH_LOW_STOCK_SQL,
      [ProductStatus.ENABLED]
    );
  }

  countCatalog({query, lowStock, status, categoryId}) {
    return this._count(
      COUNT_CATALOG_SQL,
      this._queryService.catalogFilterParams({query, lowStock, status, categoryId})
    );
  }

  countWithoutImage() {
    return this._count(COUNT_WITHOUT_IMAGE_SQL, []);
  }

  findPage({limit, offset}) {
    const size = Number(limit);
    const start = Number(offset);
    if (!Number.isInteger(size) || size < 1 || !Number.isInteger(start) || start < 0) {
      return Rx.Observable.throw(new Error('Invalid product page'));
    }
    return this._query(FIND_PAGE_SQL, [size, start]);
  }

  updateProduct({barcode, imagePath}) {
    return Rx.Observable.defer(() => {
      const previous = this._database.prepare(SELECT_PRODUCT_IMAGE_SQL).get(barcode);
      if (!previous) {
        return Rx.Observable.throw(new Error('product not found'));
      }
      const imageName = this._images.store({id: barcode, sourcePath: imagePath});
      try {
        const result = this._database.prepare(UPDATE_PRODUCT_IMAGE_SQL).run(imageName, barcode);
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
