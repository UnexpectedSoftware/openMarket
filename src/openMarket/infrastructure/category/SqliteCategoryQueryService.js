import CategorySummary from '../../domain/category/CategorySummary';
import CategoryView from '../../domain/category/CategoryView';
import {moneyFromColumns} from '../service/storedMoney';

/**
 * @typedef {object} CategoryStatsRow
 * @property {string} [id]
 * @property {string} [name]
 * @property {string | null} [image_name]
 * @property {number | string | null} [product_count]
 * @property {number | string | null} [stock_total]
 * @property {number | string | null} [base_price_total]
 * @property {number | string | null} [base_price_cents]
 * @property {number | string | null} [base_price]
 * @property {string | null} [most_sold_barcode]
 * @property {string | null} [most_sold_name]
 * @property {number | string | null} [most_sold_quantity]
 */

const CENTS_SUM_SQL = 'COALESCE(SUM(COALESCE(base_price_cents, ' +
  'CAST(ROUND(IFNULL(base_price, 0) * 100) AS INTEGER))), 0)';
const EUROS_SUM_SQL = CENTS_SUM_SQL + ' / 100.0';

const ORDER_BY_NAME_SQL = ' ORDER BY c.name COLLATE NOCASE ASC';
const COUNT_CATEGORIES_SQL = 'SELECT COUNT(*) AS total FROM category c';

const SUMMARIES_SQL = categoryStatsSql(EUROS_SUM_SQL, 'base_price_total');
const VIEWS_SQL = categoryStatsSql(CENTS_SUM_SQL, 'base_price_cents');

/**
 * Row folding and the category stats statement for SqliteCategoryRepository.
 * Injected only into that repository.
 */
export default class SqliteCategoryQueryService {

  /**
   * @param {CategoryStatsRow} row
   * @returns {CategorySummary}
   */
  summaryFrom(row) {
    return new CategorySummary({
      ...counted(row),
      imageName: row.image_name,
      basePriceTotal: Number(row.base_price_total)
    });
  }

  /**
   * One card. Does not construct a Category. `base_price_cents` wins; a legacy
   * euro `base_price` is the fallback. `imageUrl` is already resolved by the repository.
   * @param {CategoryStatsRow} row
   * @param {string | null} [imageUrl]
   * @returns {CategoryView}
   */
  viewFrom(row, imageUrl) {
    return new CategoryView({
      ...counted(row),
      imageUrl,
      basePriceCents: moneyFromColumns(row.base_price_cents, row.base_price).cents
    });
  }

  /**
   * The existing euro summary statement. `findAllWithStats` keeps this shape.
   * @returns {string}
   */
  summariesSql() {
    return SUMMARIES_SQL;
  }

  /**
   * Name filter, name order, and a page. `sort` is ignored: every value is name order.
   * Omitted `limit` (not a number) selects every match, with no LIMIT clause.
   * @param {{text?: string | null, limit?: number, offset?: number} | null} [query]
   * @returns {{sql: string, params: Array<string | number>, countSql: string, countParams: Array<string | number>}}
   */
  viewPage(query) {
    const criteria = query || {};
    const filter = nameFilter(criteria.text);
    const page = pageClause(criteria.limit, criteria.offset);
    return {
      sql: VIEWS_SQL + filter.sql + ORDER_BY_NAME_SQL + page.sql,
      params: filter.params.concat(page.params),
      countSql: COUNT_CATEGORIES_SQL + filter.sql,
      countParams: filter.params.concat()
    };
  }

}

/**
 * Shared totals for the euro summary and the cent view.
 * @param {CategoryStatsRow} row
 * @returns {{id: string | undefined, name: string | undefined, productCount: number, stockTotal: number, mostSold: {barcode: string | null | undefined, name: string | null | undefined, quantity: number} | null}}
 */
function counted(row) {
  return {
    id: row.id,
    name: row.name,
    productCount: Number(row.product_count),
    stockTotal: Number(row.stock_total),
    mostSold: mostSoldFrom(row)
  };
}

/**
 * @param {CategoryStatsRow} row
 * @returns {{barcode: string | null | undefined, name: string | null | undefined, quantity: number} | null}
 */
function mostSoldFrom(row) {
  if (row.most_sold_name == null) {
    return null;
  }
  return {
    barcode: row.most_sold_barcode,
    name: row.most_sold_name,
    quantity: Number(row.most_sold_quantity)
  };
}

/**
 * @param {string} valueSql integer cents, or that sum divided into euros
 * @param {string} valueAlias
 * @returns {string}
 */
function categoryStatsSql(valueSql, valueAlias) {
  return `
WITH product_totals AS (
  SELECT category_id,
         COUNT(*) AS product_count,
         COALESCE(SUM(stock), 0) AS stock_total,
         ${valueSql} AS ${valueAlias}
  FROM product
  WHERE category_id IS NOT NULL
  GROUP BY category_id
),
sales AS (
  SELECT p.category_id AS category_id,
         p.barcode AS barcode,
         COALESCE(p.name, '') AS name,
         SUM(s.quantity) AS quantity,
         SUM(COALESCE(s.amount_cents, CAST(ROUND(s.amount * 100) AS INTEGER))) AS amount
  FROM product_sale_day s
  INNER JOIN product p ON p.barcode = s.barcode
  WHERE p.category_id IS NOT NULL
  GROUP BY p.category_id, p.barcode, COALESCE(p.name, '')
),
ranked AS (
  SELECT category_id, barcode, name, quantity, amount,
         ROW_NUMBER() OVER (
           PARTITION BY category_id
           ORDER BY quantity DESC, amount DESC, name ASC
         ) AS rank
  FROM sales
)
SELECT c.id, c.name, c.image_name,
       COALESCE(t.product_count, 0) AS product_count,
       COALESCE(t.stock_total, 0) AS stock_total,
       COALESCE(t.${valueAlias}, 0) AS ${valueAlias},
       r.barcode AS most_sold_barcode,
       r.name AS most_sold_name,
       r.quantity AS most_sold_quantity
FROM category c
LEFT JOIN product_totals t ON t.category_id = c.id
LEFT JOIN ranked r ON r.category_id = c.id AND r.rank = 1`;
}

/**
 * @param {*} text
 * @returns {{sql: string, params: Array<string | number>}}
 */
function nameFilter(text) {
  if (text == null || text === '') {
    return {sql: '', params: []};
  }
  return {sql: ' WHERE c.name LIKE ?', params: ['%' + text + '%']};
}

/**
 * LIMIT and OFFSET only when `limit` is a number. Zero is a number.
 * @param {*} limit
 * @param {*} offset
 * @returns {{sql: string, params: Array<string | number>}}
 */
function pageClause(limit, offset) {
  if (typeof limit !== 'number') {
    return {sql: '', params: []};
  }
  return {sql: ' LIMIT ? OFFSET ?', params: [limit, offset || 0]};
}
