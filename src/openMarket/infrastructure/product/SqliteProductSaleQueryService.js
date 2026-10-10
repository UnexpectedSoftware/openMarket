import moment from 'moment';
import {add, multiply} from '../service/floatCalculatorService';

const SOLD_ON_FORMATS = ['DD/MM/YYYY HH:mm:ss', 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD'];

const BEGIN_SQL = 'BEGIN';
const COMMIT_SQL = 'COMMIT';
const ROLLBACK_SQL = 'ROLLBACK';

/**
 * Groups order lines into daily sale counters and writes them in one transaction.
 */
export default class SqliteProductSaleQueryService {

  soldOnFrom(createdAt) {
    const parsed = moment(createdAt, SOLD_ON_FORMATS, true);
    if (!parsed.isValid()) {
      throw new Error('Unrecognised date ' + createdAt);
    }
    return parsed.format('YYYY-MM-DD');
  }

  groupsFromLines(lines, soldOn) {
    const groups = new Map();
    (lines || []).forEach(line => {
      this._groupLine(groups, {
        barcode: line.barcode,
        name: line.name,
        price: line.price,
        quantity: line.quantity,
        soldOn
      });
    });
    return groups;
  }

  groupsFromOrderRows(rows) {
    const groups = new Map();
    rows.forEach(row => {
      this._groupLine(groups, {
        barcode: row.barcode,
        name: row.name,
        price: row.price,
        quantity: row.quantity,
        soldOn: this.soldOnFrom(row.createdAt)
      });
    });
    return groups;
  }

  asPoint(row) {
    return {
      soldOn: row.soldOn,
      quantity: Number(row.quantity),
      amount: Number(row.amount)
    };
  }

  mostSoldFrom(row) {
    return {
      barcode: row.barcode,
      name: row.name == null ? '' : row.name,
      imageName: row.imageName || null,
      quantity: Number(row.quantity),
      amount: Number(row.amount)
    };
  }

  quantityFrom(row) {
    return {
      barcode: row.barcode,
      quantity: Number(row.quantity)
    };
  }

  writeGroups({findDay, upsert, groups}) {
    groups.forEach(group => {
      const existing = findDay.get(group.barcode, group.soldOn);
      const quantity = existing ? add(existing.quantity, group.quantity) : group.quantity;
      const amount = existing ? add(existing.amount, group.amount) : group.amount;
      upsert.run(group.barcode, group.name, group.soldOn, quantity, amount);
    });
  }

  transaction(database, work) {
    database.exec(BEGIN_SQL);
    try {
      work();
      database.exec(COMMIT_SQL);
    } catch (error) {
      try {
        database.exec(ROLLBACK_SQL);
      } catch (rollbackError) {
        // A failed statement can already have ended the transaction.
      }
      throw error;
    }
  }

  _groupLine(groups, {barcode, name, price, quantity, soldOn}) {
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

}
