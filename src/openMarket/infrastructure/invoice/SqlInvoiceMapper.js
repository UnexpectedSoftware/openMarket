import Invoice from '../../domain/invoice/Invoice';
import InvoiceNumber from '../../domain/invoice/InvoiceNumber';

/**
 * Rows from an invoice joined to its lines, ordered by position.
 */
export default class SqlInvoiceMapper {

  /**
   * @param {{rows: Array<{id: string, series: string, number: number, issued_at: string, order_id: string | null, status: string, cancelled_at: string | null, total: number, barcode: string, name: string, price: number, quantity: number, amount: number}>}} params
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
      total: first.total,
      lines: rows.map(row => ({
        barcode: row.barcode,
        name: row.name,
        price: row.price,
        quantity: row.quantity,
        amount: row.amount
      }))
    });
  }

}
