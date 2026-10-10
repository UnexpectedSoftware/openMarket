import ProductStatus from '../../domain/product/ProductStatus';

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
      throw new Error('Invalid product page');
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

}
