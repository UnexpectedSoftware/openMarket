import Invoice from '../../domain/invoice/Invoice';
import InvoiceNumber from '../../domain/invoice/InvoiceNumber';
import {moneyFromColumns, quantityFromColumns} from '../service/storedMoney';

/**
 * Rows from an invoice joined to its lines, ordered by position.
 */
export default class SqlInvoiceMapper {

  /**
   * @param {{rows: Array<{id: string, series: string, number: number, issued_at: string, order_id: string | null, status: string, cancelled_at: string | null, total: number, total_cents?: number | null, barcode: string, name: string, price: number, quantity: number, amount: number, price_cents?: number | null, quantity_milli?: number | null, amount_cents?: number | null}>}} params
   * @returns {Invoice}
   */
  toDomain({rows}) {
    const first = rows[0];
    return Invoice.restore({
      id: first.id,
      invoiceNumber: new InvoiceNumber({series: first.series, number: Number(first.number)}),
      issuedAt: first.issued_at,
      orderId: first.order_id,
      status: first.status,
      cancelledAt: first.cancelled_at,
      total: moneyFromColumns(first.total_cents, first.total),
      lines: rows.map(row => ({
        barcode: row.barcode,
        name: row.name,
        price: moneyFromColumns(row.price_cents, row.price),
        quantity: quantityFromColumns(row.quantity_milli, row.quantity),
        amount: moneyFromColumns(row.amount_cents, row.amount)
      }))
    });
  }

}
