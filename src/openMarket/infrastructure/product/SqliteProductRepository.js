import ProductRepository from "../../domain/product/ProductRepository";
import * as Rx from "rxjs";
import ProductStatus from "../../domain/product/ProductStatus";

const PRODUCT_SELECT = 'SELECT p.barcode, p.name, p.description, p.stock_min, p.price, p.stock, p.base_price, p.status, p.weighted, p.image_name, ' +
  'p.category_id as category_id, c.name as category_name ' +
  'FROM product p LEFT JOIN category c ON c.id = p.category_id';

function sqlValue(value) {
  return value === undefined ? null : value;
}

function bit(value) {
  if (value == null) {
    return null;
  }
  return value ? 1 : 0;
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
      PRODUCT_SELECT + ' ORDER BY p.barcode LIMIT ? OFFSET ?',
      [productFilter.limit, productFilter.offset]
    );
  }

  findAllByName({name, limit, offset}) {
    return this._query(
      PRODUCT_SELECT + ' WHERE p.name LIKE ? ORDER BY p.barcode LIMIT ? OFFSET ?',
      ['%' + name + '%', limit, offset]
    );
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
    return this._count('SELECT count(*) AS total FROM product WHERE name LIKE ?', ['%' + name + '%']);
  }

  countProductsWithLowStock() {
    return this._count(
      'SELECT count(*) AS total FROM product WHERE stock <= stock_min AND status = ?',
      [ProductStatus.ENABLED]
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
