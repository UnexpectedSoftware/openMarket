import moment from 'moment';
import ProductSaleStatisticsRepository from '../../domain/product/ProductSaleStatisticsRepository';
import {add, multiply} from '../service/floatCalculatorService';

const SOLD_ON_FORMATS = ['DD/MM/YYYY HH:mm:ss', 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD'];

function soldOnFrom(createdAt) {
  const parsed = moment(createdAt, SOLD_ON_FORMATS, true);
  if (!parsed.isValid()) {
    throw new Error('Unrecognised date ' + createdAt);
  }
  return parsed.format('YYYY-MM-DD');
}

function groupLine(groups, {barcode, name, price, quantity, soldOn}) {
  if (barcode == null || String(barcode) === '') {
    return;
  }
  const qty = Number(quantity);
  const unitPrice = Number(price);
  if (!Number.isFinite(qty) || !Number.isFinite(unitPrice)) {
    return;
  }
  const key = String(barcode) + '\n' + soldOn;
  const current = groups.get(key) || {
    barcode: String(barcode),
    name: '',
    soldOn,
    quantity: 0,
    amount: 0
  };
  if (name != null) {
    current.name = String(name);
  }
  current.quantity = add(current.quantity, qty);
  current.amount = add(current.amount, multiply(unitPrice, qty));
  groups.set(key, current);
}

export default class SqliteProductSaleStatisticsRepository extends ProductSaleStatisticsRepository {

  constructor({connection}) {
    super();
    this._database = connection.database;
    this._findDay = this._database.prepare(
      'SELECT quantity, amount FROM product_sale_day WHERE barcode = ? AND sold_on = ?'
    );
    this._upsert = this._database.prepare(
      'INSERT INTO product_sale_day (barcode, name, sold_on, quantity, amount) VALUES (?, ?, ?, ?, ?) ' +
      'ON CONFLICT(barcode, sold_on) DO UPDATE SET ' +
      'name = excluded.name, quantity = excluded.quantity, amount = excluded.amount'
    );
  }

  isEmpty() {
    const row = this._database.prepare(
      'SELECT 1 AS present FROM product_sale_day LIMIT 1'
    ).get();
    return !row;
  }

  rebuildFromOrders() {
    const rows = this._database.prepare(
      'SELECT o.created_at AS createdAt, l.barcode AS barcode, l.name AS name, ' +
      'l.price AS price, l.quantity AS quantity ' +
      'FROM line l INNER JOIN "order" o ON o.id = l.order_id'
    ).all();
    const groups = new Map();
    rows.forEach(row => {
      groupLine(groups, {
        barcode: row.barcode,
        name: row.name,
        price: row.price,
        quantity: row.quantity,
        soldOn: soldOnFrom(row.createdAt)
      });
    });
    this._database.exec('BEGIN');
    try {
      this._database.exec('DELETE FROM product_sale_day');
      this._writeGroups(groups);
      this._database.exec('COMMIT');
    } catch (error) {
      try {
        this._database.exec('ROLLBACK');
      } catch (rollbackError) {
        // A failed statement can already have ended the transaction.
      }
      throw error;
    }
  }

  applyOrder({createdAt, lines}) {
    const soldOn = soldOnFrom(createdAt);
    const groups = new Map();
    (lines || []).forEach(line => {
      groupLine(groups, {
        barcode: line.barcode,
        name: line.name,
        price: line.price,
        quantity: line.quantity,
        soldOn
      });
    });
    this._database.exec('BEGIN');
    try {
      this._writeGroups(groups);
      this._database.exec('COMMIT');
    } catch (error) {
      try {
        this._database.exec('ROLLBACK');
      } catch (rollbackError) {
        // A failed statement can already have ended the transaction.
      }
      throw error;
    }
  }

  series({barcode, startOn, endOn, bucket}) {
    if (bucket === 'month') {
      return this._database.prepare(
        'SELECT strftime(\'%Y-%m\', sold_on) AS soldOn, SUM(quantity) AS quantity, SUM(amount) AS amount ' +
        'FROM product_sale_day WHERE barcode = ? AND sold_on >= ? AND sold_on <= ? ' +
        'GROUP BY strftime(\'%Y-%m\', sold_on) ORDER BY soldOn ASC'
      ).all(String(barcode), startOn, endOn).map(asPoint);
    }
    return this._database.prepare(
      'SELECT sold_on AS soldOn, quantity, amount FROM product_sale_day ' +
      'WHERE barcode = ? AND sold_on >= ? AND sold_on <= ? ORDER BY sold_on ASC'
    ).all(String(barcode), startOn, endOn).map(asPoint);
  }

  mostSold({startOn, endOn, limit}) {
    return this._database.prepare(
      'SELECT d.barcode AS barcode, COALESCE(MAX(p.name), MAX(d.name)) AS name, ' +
      'MAX(p.image_name) AS imageName, SUM(d.quantity) AS quantity, SUM(d.amount) AS amount ' +
      'FROM product_sale_day d LEFT JOIN product p ON p.barcode = d.barcode ' +
      'WHERE d.sold_on >= ? AND d.sold_on <= ? ' +
      'GROUP BY d.barcode ' +
      'ORDER BY quantity DESC, amount DESC, name ASC ' +
      'LIMIT ?'
    ).all(startOn, endOn, limit).map(row => ({
      barcode: row.barcode,
      name: row.name == null ? '' : row.name,
      imageName: row.imageName || null,
      quantity: Number(row.quantity),
      amount: Number(row.amount)
    }));
  }

  _writeGroups(groups) {
    groups.forEach(group => {
      const existing = this._findDay.get(group.barcode, group.soldOn);
      const quantity = existing ? add(existing.quantity, group.quantity) : group.quantity;
      const amount = existing ? add(existing.amount, group.amount) : group.amount;
      this._upsert.run(group.barcode, group.name, group.soldOn, quantity, amount);
    });
  }

}

function asPoint(row) {
  return {
    soldOn: row.soldOn,
    quantity: Number(row.quantity),
    amount: Number(row.amount)
  };
}
