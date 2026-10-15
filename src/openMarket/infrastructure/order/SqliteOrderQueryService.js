import Money from '../../domain/money/Money';
import {moneyFromColumns} from '../service/storedMoney';

/**
 * Folds stored order rows into the totals SqliteOrderRepository returns.
 */
export default class SqliteOrderQueryService {

  totalAmount(rows) {
    return rows.reduce((sum, row) => sum.plus(rowMoney(row)), Money.ofCents(0)).toEuros();
  }

  totalsByDay(rows) {
    const grouped = [];
    rows.forEach(row => {
      const amount = rowMoney(row);
      const last = grouped[grouped.length - 1];
      if (last && last.createdAt === row.createdAt) {
        last.total = Money.fromEuros(last.total).plus(amount).toEuros();
      } else {
        grouped.push({total: amount.toEuros(), createdAt: row.createdAt});
      }
    });
    return grouped;
  }

}

/** @param {{total?: number, total_cents?: number}} row @returns {import('../../domain/money/Money').default} */
function rowMoney(row) {
  return moneyFromColumns(row.total_cents, row.total);
}
