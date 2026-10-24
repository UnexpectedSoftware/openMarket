import * as Rx from "rxjs";
/** @typedef {import("../../domain/product/ProductRepository").default} ProductRepository */
import ProductStatus from "../../domain/product/ProductStatus";
import ProductNotFoundError from "../../domain/product/ProductNotFoundError";
import InvalidProductPageError from "../../domain/product/InvalidProductPageError";
import UnexpectedFailure from "../../domain/error/UnexpectedFailure";
import observableError from "../logging/observableError";
import {rethrow} from "../logging/ErrorLog";
import {centsOf, eurosOf, moneyFromColumns} from "../service/storedMoney";
import ProductDetail from "../../domain/product/ProductDetail";
import ProductView from "../../domain/product/ProductView";

const PRODUCT_SELECT = 'SELECT p.barcode, p.name, p.description, p.stock_min, p.price, p.price_cents, p.stock, p.base_price, p.base_price_cents, ' +
  'p.vat_percent, p.vat_kind, p.vat_cause, p.status, p.weighted, p.image_name, ' +
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

const FIND_PRODUCT_PAGE_SQL = PRODUCT_SELECT + ' WHERE 1 = 1';

const COUNT_MATCHING_PRODUCTS_SQL = 'SELECT count(*) AS total FROM product p WHERE 1 = 1';

const PRODUCT_PAGE_FILTER_SQL = ' AND (? IS NULL OR p.status = ?)' +
  ' AND (? IS NULL OR p.category_id = ?)' +
  ' AND (? IS NULL OR p.weighted = ?)' +
  ' AND (? = 0 OR p.stock <= p.stock_min)' +
  ' AND (? IS NULL OR p.name LIKE ? ESCAPE \'\\\' OR p.barcode LIKE ? ESCAPE \'\\\')';

const COUNT_WITHOUT_IMAGE_SQL = 'SELECT count(*) AS total FROM product ' +
  'WHERE (image_name IS NULL OR image_name = \'\') ' +
  'AND length(barcode) IN (8, 12, 13) ' +
  'AND barcode GLOB \'[0-9]*\' ' +
  'AND barcode NOT GLOB \'*[^0-9]*\'';

const SELECT_PRODUCT_IMAGE_SQL = 'SELECT image_name FROM product WHERE barcode = ?';

const UPSERT_PRODUCT_SQL = 'INSERT INTO product ' +
  '(barcode, base_price, base_price_cents, category_id, description, name, price, price_cents, status, stock, stock_min, weighted, image_name, vat_percent, vat_kind, vat_cause) ' +
  'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
  'ON CONFLICT(barcode) DO UPDATE SET base_price=excluded.base_price, base_price_cents=excluded.base_price_cents, ' +
  'category_id=excluded.category_id, description=excluded.description, name=excluded.name, ' +
  'price=excluded.price, price_cents=excluded.price_cents, status=excluded.status, ' +
  'stock=excluded.stock, stock_min=excluded.stock_min, weighted=excluded.weighted, ' +
  'image_name=COALESCE(excluded.image_name, product.image_name), ' +
  'vat_percent=excluded.vat_percent, vat_kind=excluded.vat_kind, vat_cause=excluded.vat_cause';

const UPDATE_PRODUCT_IMAGE_SQL = 'UPDATE product SET image_name = ? WHERE barcode = ?';

/** @implements {ProductRepository} */
export default class SqliteProductRepository {
  constructor({connection, productMapper, images, queryService}) {
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
          eurosOf(product.basePrice),
          centsOf(product.basePrice),
          this._queryService.sqlValue(product.category.id),
          this._queryService.sqlValue(product.description),
          this._queryService.sqlValue(product.name),
          eurosOf(product.price),
          centsOf(product.price),
          this._queryService.sqlValue(product.status),
          this._queryService.sqlValue(product.stock),
          this._queryService.sqlValue(product.stockMin),
          this._queryService.bit(product.isWeighted),
          imageName,
          product.vatRate.percent,
          product.vatRate.kind,
          product.vatRate.cause
        );
      } catch (insertError) {
        if (imageName && imageName !== previousName) {
          this._images.remove(imageName);
        }
        rethrow(insertError, {
          message: 'Could not save the product',
          context: {barcode: product.barcode, name: product.name, operation: 'save'}
        });
      }
      if (imageName && previousName && previousName !== imageName) {
        this._images.remove(previousName);
      }
      return Rx.Observable.of(null);
    });
  }

  findDetail(query) {
    return Rx.Observable.defer(() => {
      const barcode = query && query.barcode;
      if (barcode == null || barcode === '') {
        return Rx.Observable.empty();
      }
      const row = this._database.prepare(FIND_BY_BARCODE_SQL).get(String(barcode));
      if (!row) {
        return Rx.Observable.empty();
      }
      return Rx.Observable.of(toProductDetail(row, this._images));
    });
  }

  find(query) {
    return Rx.Observable.defer(() => {
      const page = this._queryService.productPage({
        statement: FIND_PRODUCT_PAGE_SQL,
        countStatement: COUNT_MATCHING_PRODUCTS_SQL,
        orderBySql: ' ORDER BY ',
        filterSql: PRODUCT_PAGE_FILTER_SQL,
        query
      });
      const rows = this._database.prepare(page.sql).all(...page.params);
      const count = this._database.prepare(page.countSql).get(...page.countParams);
      return Rx.Observable.of({
        items: rows.map(row => toProductView(row, this._images)),
        total: Number(count.total)
      });
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
      return observableError(new InvalidProductPageError({
        limit: size,
        offset: start,
        operation: 'findPage'
      }));
    }
    return this._query(FIND_PAGE_SQL, [size, start]);
  }

  updateProduct({barcode, imagePath}) {
    return Rx.Observable.defer(() => {
      const previous = this._database.prepare(SELECT_PRODUCT_IMAGE_SQL).get(barcode);
      if (!previous) {
        return observableError(new ProductNotFoundError({barcode, operation: 'updateImage'}));
      }
      const imageName = this._images.store({id: barcode, sourcePath: imagePath});
      try {
        const result = this._database.prepare(UPDATE_PRODUCT_IMAGE_SQL).run(imageName, barcode);
        if (Number(result.changes) === 0) {
          this._images.remove(imageName);
          return observableError(new ProductNotFoundError({barcode, operation: 'updateImage'}));
        }
      } catch (updateError) {
        if (imageName !== previous.image_name) {
          this._images.remove(imageName);
        }
        return observableError(new UnexpectedFailure({
          message: `Could not update the product image: ${updateError.message}`,
          userMessage: updateError.message,
          context: {barcode, operation: 'updateImage'},
          cause: updateError
        }));
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

/**
 * @typedef {object} ProductPageRow
 * @property {string | null} [barcode]
 * @property {string | null} [name]
 * @property {string | null} [category_id]
 * @property {string | null} [category_name]
 * @property {number | null} [price]
 * @property {number | null} [price_cents]
 * @property {number | null} [base_price]
 * @property {number | null} [base_price_cents]
 * @property {number | null} [vat_percent]
 * @property {string | null} [vat_kind]
 * @property {string | null} [vat_cause]
 * @property {number | null} [stock]
 * @property {number | null} [stock_min]
 * @property {number | null} [weighted]
 * @property {string | null} [status]
 * @property {string | null} [image_name]
 * @property {string | null} [description]
 */

/**
 * A stored row as a read model. It does not build a Product.
 * @param {ProductPageRow} row
 * @param {{readDataUrl: (name: string) => (string | null)} | null | undefined} images
 * @returns {ProductView}
 */
function toProductView(row, images) {
  return new ProductView(viewProps(row, images));
}

/**
 * @param {ProductPageRow} row
 * @param {{readDataUrl: (name: string) => (string | null)} | null | undefined} images
 * @returns {ProductDetail}
 */
function toProductDetail(row, images) {
  return new ProductDetail({
    ...viewProps(row, images),
    description: row.description == null ? '' : String(row.description),
    imageName: emptyToNull(row.image_name)
  });
}

/**
 * @param {ProductPageRow} row
 * @param {{readDataUrl: (name: string) => (string | null)} | null | undefined} images
 */
function viewProps(row, images) {
  return {
    barcode: textOf(row.barcode),
    name: textOf(row.name),
    categoryId: emptyToNull(row.category_id),
    categoryName: emptyToNull(row.category_name),
    priceCents: moneyFromColumns(row.price_cents, row.price).cents,
    basePriceCents: moneyFromColumns(row.base_price_cents, row.base_price).cents,
    vat: vatData(row),
    stock: finiteOrNull(row.stock),
    stockMin: finiteOrNull(row.stock_min),
    weighted: Number(row.weighted) === 1,
    status: emptyToNull(row.status),
    imageUrl: imageUrl(images, row.image_name)
  };
}

/**
 * @param {*} value
 * @returns {string}
 */
function textOf(value) {
  return value == null ? '' : String(value);
}

/**
 * @param {*} value
 * @returns {string | null}
 */
function emptyToNull(value) {
  if (value == null || value === '') {
    return null;
  }
  return String(value);
}

/**
 * @param {*} value
 * @returns {number | null}
 */
function finiteOrNull(value) {
  if (value == null || value === '') {
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }
  return number;
}

/**
 * @param {ProductPageRow} row
 * @returns {{kind: string, percent: number, cause: string | null}}
 */
function vatData(row) {
  return {
    kind: row.vat_kind == null || row.vat_kind === '' ? 'S1' : String(row.vat_kind),
    percent: row.vat_percent == null ? 21 : Number(row.vat_percent),
    cause: emptyToNull(row.vat_cause)
  };
}

/**
 * @param {{readDataUrl: (name: string) => (string | null)} | null | undefined} images
 * @param {*} imageName
 * @returns {string | null}
 */
function imageUrl(images, imageName) {
  if (!images || !imageName) {
    return null;
  }
  return images.readDataUrl(imageName);
}
