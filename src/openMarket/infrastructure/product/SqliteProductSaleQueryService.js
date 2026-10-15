import moment from 'moment';
import Money from '../../domain/money/Money';
import Quantity from '../../domain/money/Quantity';
import UnrecognisedDateError from '../../domain/error/UnrecognisedDateError';
import {raise} from '../logging/ErrorLog';
import {moneyFromColumns, quantityFromColumns} from '../service/storedMoney';

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
      raise(new UnrecognisedDateError({value: createdAt}));
    }
    return parsed.format('YYYY-MM-DD');
  }

  groupsFromLines(lines, soldOn) {
    const groups = new Map();
    (lines || []).forEach(line => {
      this._groupLine(groups, {...line, soldOn});
    });
    return groups;
  }

  groupsFromOrderRows(rows) {
    const groups = new Map();
    rows.forEach(row => {
      this._groupLine(groups, {...row, soldOn: this.soldOnFrom(row.createdAt)});
    });
    return groups;
  }

  asPoint(row) {
    return {
      soldOn: row.soldOn,
      quantity: Number(row.quantity),
      amount: moneyFromColumns(row.amount_cents, row.amount).toEuros()
    };
  }

  mostSoldFrom(row) {
    return {
      barcode: row.barcode,
      name: row.name == null ? '' : row.name,
      imageName: row.imageName || null,
      quantity: Number(row.quantity),
      amount: moneyFromColumns(row.amount_cents, row.amount).toEuros()
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
      const quantity = existing
        ? Quantity.fromDecimal(existing.quantity).plus(group.quantity)
        : group.quantity;
      const amount = existing
        ? moneyFromColumns(existing.amount_cents, existing.amount).plus(group.amount)
        : group.amount;
      upsert.run(
        group.barcode,
        group.name,
        group.soldOn,
        quantity.units,
        amount.toEuros(),
        amount.cents
      );
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

  _groupLine(groups, line) {
    const barcode = line.barcode;
    if (barcode == null || String(barcode) === '') {
      return;
    }
    let price;
    let quantity;
    let amount;
    try {
      price = line.priceCents != null ? Money.ofCents(Number(line.priceCents)) : Money.from(line.price);
      quantity = line.quantityMilli != null
        ? Quantity.ofMilli(Number(line.quantityMilli))
        : Quantity.from(line.quantity);
      amount = line.amountCents != null
        ? Money.ofCents(Number(line.amountCents))
        : price.times(quantity.milli < 0 ? Quantity.ofMilli(0) : quantity);
    } catch (error) {
      return;
    }
    const key = String(barcode) + '\n' + line.soldOn;
    const current = groups.get(key) || {
      barcode: String(barcode),
      name: '',
      soldOn: line.soldOn,
      quantity: Quantity.ofMilli(0),
      amount: Money.ofCents(0)
    };
    if (line.name != null) {
      current.name = String(line.name);
    }
    current.quantity = current.quantity.plus(quantity);
    current.amount = current.amount.plus(amount);
    groups.set(key, current);
  }

}
