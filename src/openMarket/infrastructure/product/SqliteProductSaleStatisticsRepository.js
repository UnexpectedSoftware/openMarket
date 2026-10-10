import ProductSaleStatisticsRepository from '../../domain/product/ProductSaleStatisticsRepository';

const FIND_SALE_DAY_SQL =
  'SELECT quantity, amount FROM product_sale_day WHERE barcode = ? AND sold_on = ?';

const UPSERT_SALE_DAY_SQL =
  'INSERT INTO product_sale_day (barcode, name, sold_on, quantity, amount) VALUES (?, ?, ?, ?, ?) ' +
  'ON CONFLICT(barcode, sold_on) DO UPDATE SET ' +
  'name = excluded.name, quantity = excluded.quantity, amount = excluded.amount';

const SALE_DAY_PRESENT_SQL = 'SELECT 1 AS present FROM product_sale_day LIMIT 1';

const ORDER_LINES_SQL =
  'SELECT o.created_at AS createdAt, l.barcode AS barcode, l.name AS name, ' +
  'l.price AS price, l.quantity AS quantity ' +
  'FROM line l INNER JOIN "order" o ON o.id = l.order_id';

const DELETE_SALE_DAYS_SQL = 'DELETE FROM product_sale_day';

const SERIES_BY_MONTH_SQL =
  'SELECT strftime(\'%Y-%m\', sold_on) AS soldOn, SUM(quantity) AS quantity, SUM(amount) AS amount ' +
  'FROM product_sale_day WHERE barcode = ? AND sold_on >= ? AND sold_on <= ? ' +
  'GROUP BY strftime(\'%Y-%m\', sold_on) ORDER BY soldOn ASC';

const SERIES_BY_DAY_SQL =
  'SELECT sold_on AS soldOn, quantity, amount FROM product_sale_day ' +
  'WHERE barcode = ? AND sold_on >= ? AND sold_on <= ? ORDER BY sold_on ASC';

const MOST_SOLD_SQL =
  'SELECT d.barcode AS barcode, COALESCE(MAX(p.name), MAX(d.name)) AS name, ' +
  'MAX(p.image_name) AS imageName, SUM(d.quantity) AS quantity, SUM(d.amount) AS amount ' +
  'FROM product_sale_day d LEFT JOIN product p ON p.barcode = d.barcode ' +
  'WHERE d.sold_on >= ? AND d.sold_on <= ? ' +
  'GROUP BY d.barcode ' +
  'ORDER BY quantity DESC, amount DESC, name ASC ' +
  'LIMIT ?';

const QUANTITIES_SQL =
  'SELECT barcode, SUM(quantity) AS quantity FROM product_sale_day ' +
  'WHERE sold_on >= ? AND sold_on <= ? AND barcode IN (';

const QUANTITIES_GROUP_SQL = ') GROUP BY barcode';

export default class SqliteProductSaleStatisticsRepository extends ProductSaleStatisticsRepository {

  constructor({connection, queryService}) {
    super();
    this._database = connection.database;
    this._queryService = queryService;
    this._findDay = this._database.prepare(FIND_SALE_DAY_SQL);
    this._upsert = this._database.prepare(UPSERT_SALE_DAY_SQL);
  }

  isEmpty() {
    const row = this._database.prepare(SALE_DAY_PRESENT_SQL).get();
    return !row;
  }

  rebuildFromOrders() {
    const rows = this._database.prepare(ORDER_LINES_SQL).all();
    const groups = this._queryService.groupsFromOrderRows(rows);
    this._queryService.transaction(this._database, () => {
      this._database.exec(DELETE_SALE_DAYS_SQL);
      this._write(groups);
    });
  }

  applyOrder({createdAt, lines}) {
    const soldOn = this._queryService.soldOnFrom(createdAt);
    const groups = this._queryService.groupsFromLines(lines, soldOn);
    this._queryService.transaction(this._database, () => {
      this._write(groups);
    });
  }

  series({barcode, startOn, endOn, bucket}) {
    const sql = bucket === 'month' ? SERIES_BY_MONTH_SQL : SERIES_BY_DAY_SQL;
    return this._database.prepare(sql).all(String(barcode), startOn, endOn)
      .map(row => this._queryService.asPoint(row));
  }

  mostSold({startOn, endOn, limit}) {
    return this._database.prepare(MOST_SOLD_SQL).all(startOn, endOn, limit)
      .map(row => this._queryService.mostSoldFrom(row));
  }

  quantities({barcodes, startOn, endOn}) {
    const ids = (barcodes || []).map(barcode => String(barcode));
    if (ids.length === 0) {
      return [];
    }
    const marks = ids.map(() => '?').join(', ');
    return this._database.prepare(QUANTITIES_SQL + marks + QUANTITIES_GROUP_SQL)
      .all(startOn, endOn, ...ids)
      .map(row => this._queryService.quantityFrom(row));
  }

  _write(groups) {
    this._queryService.writeGroups({
      findDay: this._findDay,
      upsert: this._upsert,
      groups
    });
  }

}
