/** @import Invoice from './Invoice' */

/**
 * Public InvoiceIssued payload, schema version 1.
 * Amounts are integer cents. Missing values are null, never undefined.
 * @param {Invoice} invoice
 */
export function issuedPayload(invoice) {
  const breakdown = (invoice.breakdown || []).map(row => ({
    kind: row.rate.kind,
    percent: Number(row.rate.percent),
    cause: row.rate.cause == null ? null : row.rate.cause,
    baseCents: row.base.cents,
    quotaCents: row.quota.cents,
    grossCents: row.gross.cents
  }));
  return {
    schemaVersion: 1,
    invoiceId: invoice.id,
    type: invoice.type,
    series: invoice.invoiceNumber.series,
    number: invoice.invoiceNumber.number,
    invoiceNumber: invoice.invoiceNumber.formatted,
    issueDate: invoice.issueDate,
    issuedAt: invoice.issuedAt,
    orderId: invoice.orderId == null ? null : invoice.orderId,
    currency: 'EUR',
    issuer: issuerOf(invoice),
    lines: invoice.lines.map((line, position) => ({
      position,
      barcode: line.barcode,
      name: line.name,
      unitPriceCents: line.price.cents,
      quantityMilli: line.quantity.milli,
      amountCents: line.amount.cents,
      vat: {
        kind: line.vatRate.kind,
        percent: Number(line.vatRate.percent),
        cause: line.vatRate.cause == null ? null : line.vatRate.cause
      }
    })),
    vatBreakdown: breakdown,
    totalCents: invoice.total.cents,
    vatTotalCents: breakdown.reduce((sum, row) => sum + row.quotaCents, 0),
    corrects: invoice.correctsInvoiceId
      ? {invoiceId: invoice.correctsInvoiceId, invoiceNumber: null, issueDate: null}
      : null
  };
}

/**
 * Public InvoiceCancelled payload, schema version 1.
 * The identifying fields match the issued document. Lines are not repeated.
 * @param {Invoice} invoice
 * @param {{reason?: string | null, cancelledAt?: string | null}} [options]
 */
export function cancelledPayload(invoice, {reason = null, cancelledAt} = {}) {
  const issued = issuedPayload(invoice);
  return {
    schemaVersion: 1,
    invoiceId: issued.invoiceId,
    type: issued.type,
    series: issued.series,
    number: issued.number,
    invoiceNumber: issued.invoiceNumber,
    issueDate: issued.issueDate,
    issuedAt: issued.issuedAt,
    issuer: issued.issuer,
    totalCents: issued.totalCents,
    cancelledAt: cancelledAt == null ? invoice.cancelledAt : cancelledAt,
    reason: reason == null ? null : reason
  };
}

/**
 * @param {Invoice} invoice
 * @returns {object | null}
 */
function issuerOf(invoice) {
  const issuer = invoice.issuer;
  if (!issuer) {
    return null;
  }
  const address = issuer.address || {};
  return {
    nif: issuer.nif,
    legalName: issuer.legalName,
    tradeName: issuer.tradeName == null || issuer.tradeName === '' ? null : issuer.tradeName,
    address: {
      street: address.street == null ? '' : address.street,
      postalCode: address.postalCode == null ? '' : address.postalCode,
      city: address.city == null ? '' : address.city,
      province: address.province == null ? '' : address.province,
      country: address.country == null ? '' : address.country
    }
  };
}
