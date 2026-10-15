import Invoice from '../../domain/invoice/Invoice';
import InvoiceNumber from '../../domain/invoice/InvoiceNumber';
import {moneyFromColumns, quantityFromColumns} from '../service/storedMoney';
import Money from '../../domain/money/Money';

/**
 * Rows from an invoice joined to its lines, ordered by position.
 */
export default class SqlInvoiceMapper {

  /**
   * @param {{rows: Array<{id: string, series: string, number: number, issued_at: string, order_id: string | null, status: string, cancelled_at: string | null, total: number, total_cents?: number | null, barcode: string, name: string, price: number, quantity: number, amount: number, price_cents?: number | null, quantity_milli?: number | null, amount_cents?: number | null, vat_percent?: number | null, vat_kind?: string | null, vat_cause?: string | null}>, vatRows?: Array<{kind: string, percent: number, cause: string | null, base_cents: number, quota_cents: number, gross_cents: number}>}} params
   * @returns {Invoice}
   */
  toDomain({rows, vatRows}) {
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
        amount: moneyFromColumns(row.amount_cents, row.amount),
        vatRate: {
          percent: row.vat_percent,
          kind: row.vat_kind,
          cause: row.vat_cause
        }
      })),
      breakdown: vatRows && vatRows.length > 0 ? vatRows.map(row => ({
        rate: {kind: row.kind, percent: row.percent, cause: row.cause},
        base: Money.ofCents(Number(row.base_cents)),
        quota: Money.ofCents(Number(row.quota_cents)),
        gross: Money.ofCents(Number(row.gross_cents))
      })) : undefined
    });
  }

}
