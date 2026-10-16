import {receiptBlock} from './ReceiptBlock';

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
  if (payload.invoiceNumber) {
    blocks.push(text(payload.invoiceNumber, {align: 'center'}));
  }
  blocks.push(text('Date ' + payload.issueDate + ' ' + payload.issuedAt, {align: 'center'}));
  blocks.push({type: 'line'});
  (payload.lines || []).forEach(line => {
    const name = String(line.name || '').slice(0, 19);
    blocks.push(text(
      name + '  ' + formatUnits(line.quantityMilli) + ' x ' + euros(line.unitPriceCents) + ' = ' + euros(line.amountCents)
    ));
  });
  blocks.push(text('Total: ' + euros(payload.totalCents) + ' €', {align: 'right', bold: true}));
  blocks.push({type: 'line'});
  (payload.vatBreakdown || []).forEach(row => {
    blocks.push(text(vatLabel(row) + '  base ' + euros(row.baseCents) + '  cuota ' + euros(row.quotaCents)));
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
 * @param {number} milli
 * @returns {string}
 */
function formatUnits(milli) {
  const value = Number(milli) || 0;
  const whole = Math.trunc(value / 1000);
  const frac = Math.abs(value % 1000);
  if (frac === 0) {
    return String(whole);
  }
  return whole + '.' + String(frac).padStart(3, '0').replace(/0+$/, '');
}

/**
 * @param {number} cents
 * @returns {string}
 */
function euros(cents) {
  const value = Number(cents) || 0;
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  return sign + Math.trunc(abs / 100) + '.' + String(abs % 100).padStart(2, '0');
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
