import {receiptBlock} from './ReceiptBlock';
import {formatEuroCents, formatQuantityMilli, formatTicketWhen} from '../money/formatEs';

/**
 * The shop's own ticket, built from the version 1 invoice payload.
 * @param {*} payload
 * @returns {object[]}
 */
export function coreBlocks(payload) {
  if (!payload) {
    return [];
  }
  const blocks = [];
  const title = payload.issuer && (payload.issuer.tradeName || payload.issuer.legalName);
  if (title) {
    blocks.push(text(title, {align: 'center', bold: true, size: 'large'}));
  }
  if (payload.issuer && payload.issuer.nif) {
    blocks.push(text('NIF ' + payload.issuer.nif, {align: 'center'}));
  }
  blocks.push(text('FACTURA SIMPLIFICADA', {align: 'center'}));
  if (payload.invoiceNumber) {
    blocks.push(text(payload.invoiceNumber, {align: 'center'}));
  }
  const when = formatTicketWhen(payload.issueDate, payload.issuedAt);
  if (when) {
    blocks.push(text(when, {align: 'center'}));
  }
  blocks.push({type: 'line'});
  (payload.lines || []).forEach(line => {
    const name = String(line.name || '').slice(0, 19);
    blocks.push(text(
      name + '  ' + formatQuantityMilli(line.quantityMilli) + ' x ' +
      formatEuroCents(line.unitPriceCents) + ' = ' + formatEuroCents(line.amountCents)
    ));
  });
  blocks.push(text('TOTAL ' + formatEuroCents(payload.totalCents), {align: 'right', bold: true}));
  blocks.push({type: 'line'});
  (payload.vatBreakdown || []).forEach(row => {
    blocks.push(text(
      vatLabel(row) + '  base ' + formatEuroCents(row.baseCents) + '  cuota ' + formatEuroCents(row.quotaCents)
    ));
  });
  return blocks.map(block => receiptBlock(block));
}

/**
 * @param {string} value
 * @param {{align?: string, bold?: boolean, size?: string}} [style]
 * @returns {object}
 */
function text(value, style) {
  return {type: 'text', text: value, ...(style || {})};
}

/**
 * @param {{kind?: string, percent?: number, cause?: string | null}} row
 * @returns {string}
 */
function vatLabel(row) {
  if (row.kind === 'E') {
    return 'Exento ' + row.cause;
  }
  if (row.kind === 'N') {
    return 'No sujeto ' + row.cause;
  }
  return String(row.percent) + ' %';
}
