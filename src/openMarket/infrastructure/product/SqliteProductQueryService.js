import ProductStatus from '../../domain/product/ProductStatus';
import InvalidProductPageError from '../../domain/product/InvalidProductPageError';
import {raise} from '../logging/ErrorLog';

const NAME_KEY = "COALESCE(p.name, '')";
const STOCK_MISSING = '(p.stock IS NULL)';

const ORDER_NAME_ASC_SQL = NAME_KEY + ' COLLATE NOCASE ASC, p.barcode ASC';
const ORDER_NAME_DESC_SQL = NAME_KEY + ' COLLATE NOCASE DESC, p.barcode ASC';
const ORDER_STOCK_ASC_SQL = STOCK_MISSING + ' ASC, p.stock ASC, p.barcode ASC';
const ORDER_STOCK_DESC_SQL = STOCK_MISSING + ' ASC, p.stock DESC, p.barcode ASC';

const AFTER_NAME_ASC_SQL = ' AND (' + NAME_KEY + ' COLLATE NOCASE > ?' +
  ' OR (' + NAME_KEY + ' COLLATE NOCASE = ? AND p.barcode > ?))';
const AFTER_NAME_DESC_SQL = ' AND (' + NAME_KEY + ' COLLATE NOCASE < ?' +
  ' OR (' + NAME_KEY + ' COLLATE NOCASE = ? AND p.barcode > ?))';
const AFTER_STOCK_ASC_SQL = ' AND (' + STOCK_MISSING + ' > ?' +
  ' OR (' + STOCK_MISSING + ' = ? AND ? = 0 AND (p.stock > ? OR (p.stock = ? AND p.barcode > ?)))' +
  ' OR (' + STOCK_MISSING + ' = ? AND ? = 1 AND p.barcode > ?))';
const AFTER_STOCK_DESC_SQL = ' AND (' + STOCK_MISSING + ' > ?' +
  ' OR (' + STOCK_MISSING + ' = ? AND ? = 0 AND (p.stock < ? OR (p.stock = ? AND p.barcode > ?)))' +
  ' OR (' + STOCK_MISSING + ' = ? AND ? = 1 AND p.barcode > ?))';

/**
 * @typedef {object} ProductPageCriteria
 * @property {string | null} [text]
 * @property {string | null} [categoryId]
 * @property {string | null} [status]
 * @property {boolean | null} [weighted]
 * @property {boolean} [lowStock]
 * @property {string | null} [sort]
 * @property {number} [limit]
 * @property {number} [offset]
 * @property {boolean} [forSale]
 */

/**
 * Catalog clause selection and statement values for SqliteProductRepository.
 */
export default class SqliteProductQueryService {

  sqlValue(value) {
    return value === undefined ? null : value;
  }

  bit(value) {
    if (value == null) {
      return null;
    }
    return value ? 1 : 0;
  }

  /**
   * Keyset page for the catalog. SQL text comes from the repository constants
   * plus one order clause and one cursor clause declared above.
   * @returns {{sql: string, params: Array, size: number}}
   */
  catalogPage({
    statement,
    filterSql,
    orderBySql,
    limitSql,
    query,
    lowStock,
    status,
    categoryId,
    sort,
    after,
    limit
  }) {
    const size = Number(limit);
    if (!Number.isInteger(size) || size < 1) {
      raise(new InvalidProductPageError({limit: size, operation: 'findCatalog'}));
    }
    const order = this._sort(sort);
    const cursor = this._cursor(after);
    const pageAfter = this._after(order, cursor);
    return {
      sql: statement + pageAfter.sql + filterSql + orderBySql + this._orderSql(order) + limitSql,
      params: [
        ...pageAfter.params,
        ...this.catalogFilterParams({query, lowStock, status, categoryId}),
        size + 1
      ],
      size
    };
  }

  catalogFilterParams({query, lowStock, status, categoryId}) {
    const text = query == null ? '' : String(query).trim();
    const pattern = this._likeContains(text);
    const category = categoryId ? categoryId : null;
    const selected = this._status(status);
    return [
      lowStock ? 1 : 0,
      selected, selected,
      category, category,
      text, pattern, pattern
    ];
  }

  _sort(sort) {
    if (sort === 'name_asc' || sort === 'name_desc' || sort === 'stock_asc' || sort === 'stock_desc') {
      return sort;
    }
    return 'name_asc';
  }

  _cursor(after) {
    if (after == null) {
      return null;
    }
    if (typeof after.barcode !== 'string' || after.barcode === '' || typeof after.name !== 'string') {
      raise(new InvalidProductPageError({
        operation: 'findCatalog',
        barcode: after.barcode,
        name: after.name
      }));
    }
    if (after.stock == null) {
      return {name: after.name, stock: null, barcode: after.barcode};
    }
    const stock = Number(after.stock);
    if (!Number.isFinite(stock)) {
      raise(new InvalidProductPageError({
        operation: 'findCatalog',
        barcode: after.barcode,
        name: after.name
      }));
    }
    return {name: after.name, stock, barcode: after.barcode};
  }

  _orderSql(sort) {
    if (sort === 'name_desc') {
      return ORDER_NAME_DESC_SQL;
    }
    if (sort === 'stock_asc') {
      return ORDER_STOCK_ASC_SQL;
    }
    if (sort === 'stock_desc') {
      return ORDER_STOCK_DESC_SQL;
    }
    return ORDER_NAME_ASC_SQL;
  }

  _after(sort, cursor) {
    if (cursor == null) {
      return {sql: '', params: []};
    }
    if (sort === 'name_asc' || sort === 'name_desc') {
      return {
        sql: sort === 'name_desc' ? AFTER_NAME_DESC_SQL : AFTER_NAME_ASC_SQL,
        params: [cursor.name, cursor.name, cursor.barcode]
      };
    }
    const missing = cursor.stock == null ? 1 : 0;
    return {
      sql: sort === 'stock_desc' ? AFTER_STOCK_DESC_SQL : AFTER_STOCK_ASC_SQL,
      params: [
        missing,
        missing, missing, cursor.stock, cursor.stock, cursor.barcode,
        missing, missing, cursor.barcode
      ]
    };
  }

  _status(status) {
    if (status === ProductStatus.ENABLED || status === ProductStatus.DISABLED) {
      return status;
    }
    return null;
  }

  _likeContains(text) {
    return '%' + text.replace(/[\\%_]/g, (char) => '\\' + char) + '%';
  }

  /**
   * Offset page for ProductRepository.find. forSale caps the page at 80
   * (default 24). A management list uses the given limit, or no cap.
   * @param {{statement: string, countStatement: string, orderBySql: string, filterSql: string, query?: ProductPageCriteria}} command
   * @returns {{sql: string, params: Array<string | number | null>, countSql: string, countParams: Array<string | number | null>}}
   */
  productPage({statement, countStatement, orderBySql, filterSql, query}) {
    const criteria = query || {};
    const order = this._orderSql(this._sort(criteria.sort));
    const page = pageClause(criteria);
    const params = this._filterParams(criteria);
    return {
      sql: statement + filterSql + orderBySql + order + page.sql,
      params: params.concat(page.params),
      countSql: countStatement + filterSql,
      countParams: params
    };
  }

  /**
   * @param {ProductPageCriteria} criteria
   * @returns {Array<string | number | null>}
   */
  _filterParams(criteria) {
    return filterParams({
      status: criteria.forSale ? ProductStatus.ENABLED : this._status(criteria.status),
      categoryId: criteria.categoryId,
      weighted: criteria.weighted,
      lowStock: criteria.lowStock,
      pattern: likePattern(this, criteria.text)
    });
  }

}

/**
 * @param {{status: string | null, categoryId?: string | null, weighted?: boolean | null, lowStock?: boolean, pattern: string | null}} values
 * @returns {Array<string | number | null>}
 */
function filterParams({status, categoryId, weighted, lowStock, pattern}) {
  const category = categoryParam(categoryId);
  const weight = weightedParam(weighted);
  const stock = lowStock ? 1 : 0;
  return [status, status, category, category, weight, weight, stock, pattern, pattern, pattern];
}

/**
 * @param {ProductPageCriteria} criteria
 * @returns {{sql: string, params: number[]}}
 */
function pageClause(criteria) {
  const offset = criteria.offset || 0;
  if (criteria.forSale) {
    return {sql: ' LIMIT ? OFFSET ?', params: [saleCap(criteria.limit), offset]};
  }
  return {sql: ' LIMIT ? OFFSET ?', params: [listCap(criteria.limit), offset]};
}

/**
 * Sell grid: default 24, never more than 80.
 * @param {number | undefined} limit
 * @returns {number}
 */
function saleCap(limit) {
  const value = Number(limit);
  if (!Number.isInteger(value) || value <= 0) {
    return 24;
  }
  return value > 80 ? 80 : value;
}

/**
 * Management list: a positive limit, or no cap.
 * @param {number | undefined} limit
 * @returns {number}
 */
function listCap(limit) {
  const value = Number(limit);
  if (!Number.isInteger(value) || value <= 0) {
    return -1;
  }
  return value;
}

/**
 * @param {*} categoryId
 * @returns {string | null}
 */
function categoryParam(categoryId) {
  return categoryId ? String(categoryId) : null;
}

/**
 * @param {boolean | null | undefined} weighted
 * @returns {number | null}
 */
function weightedParam(weighted) {
  if (weighted == null) {
    return null;
  }
  return weighted ? 1 : 0;
}

/**
 * @param {{_likeContains: (text: string) => string}} service
 * @param {*} text
 * @returns {string | null}
 */
function likePattern(service, text) {
  const value = text == null ? '' : String(text).trim();
  if (value === '') {
    return null;
  }
  return service._likeContains(value);
}
