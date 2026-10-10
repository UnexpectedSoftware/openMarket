import {add} from '../service/floatCalculatorService';

/**
 * Folds stored order rows into the totals SqliteOrderRepository returns.
 */
export default class SqliteOrderQueryService {

  totalAmount(rows) {
    return rows.reduce((sum, row) => add(sum, row.total), 0);
  }

  totalsByDay(rows) {
    const grouped = [];
    rows.forEach(row => {
      const last = grouped[grouped.length - 1];
      if (last && last.createdAt === row.createdAt) {
        last.total = add(last.total, row.total);
      } else {
        grouped.push({total: row.total, createdAt: row.createdAt});
      }
    });
    return grouped;
  }

}
