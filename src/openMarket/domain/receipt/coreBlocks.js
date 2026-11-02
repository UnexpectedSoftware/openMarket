import {receiptBlock} from './ReceiptBlock';
import {formatEuroCents, formatKgMilli, formatQuantityMilli, formatTicketWhen} from '../money/formatEs';

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
  addressLines(payload.issuer).forEach(line => {
    blocks.push(text(line, {align: 'center'}));
  });
  if (payload.issuer && payload.issuer.phone) {
    blocks.push(text('Tel. ' + payload.issuer.phone, {align: 'center'}));
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
    blocks.push(text(lineText(line, payload.paperWidthMm)));
  });
  blocks.push(text('TOTAL ' + formatEuroCents(payload.totalCents), {align: 'right', bold: true}));
  blocks.push({type: 'line'});
  (payload.vatBreakdown || []).forEach(row => {
    blocks.push(text(
      vatLabel(row) + '  base ' + formatEuroCents(row.baseCents) + '  cuota ' + formatEuroCents(row.quotaCents)
    ));
  });
  paymentLines(payload.payment).forEach(line => {
    blocks.push(text(line));
  });
  return blocks.map(block => receiptBlock(block));
}

/**
 * @param {string} value
 * @param {{align?: string, bold?: boolean, size?: string}} [style]
 * @returns {object}
 */
/**
 * @param {{name?: string, quantityMilli?: number, unitPriceCents?: number, amountCents?: number, weighted?: boolean}} line
 * @returns {string}
 */
function lineText(line, paperWidthMm) {
  const name = String(line.name || '').slice(0, paperWidthMm === 80 ? 32 : 19);
  const weighed = line.weighted === true;
  const quantity = weighed
    ? formatKgMilli(line.quantityMilli) + ' kg'
    : formatQuantityMilli(line.quantityMilli);
  const price = formatEuroCents(line.unitPriceCents) + (weighed ? '/kg' : '');
  return name + '  ' + quantity + ' x ' + price + ' = ' + formatEuroCents(line.amountCents);
}

function text(value, style) {
  return {type: 'text', text: value, ...(style || {})};
}

/**
 * Street, postal code and city, then a province or country that adds a place.
 * @param {{address?: {street?: string, postalCode?: string, city?: string, province?: string, country?: string}} | null | undefined} issuer
 * @returns {string[]}
 */
function addressLines(issuer) {
  const address = issuer && issuer.address;
  if (!address) {
    return [];
  }
  const lines = [];
  if (address.street) {
    lines.push(String(address.street));
  }
  const city = [address.postalCode, address.city].filter(part => part).join(' ');
  if (city) {
    lines.push(city);
  }
  if (address.province && address.province !== address.city) {
    lines.push(String(address.province));
  }
  if (address.country && address.country !== 'ES') {
    lines.push(String(address.country));
  }
  return lines;
}

/**
 * Cash names the notes and the change. Card is the method alone.
 * @param {{method?: string, tenderedCents?: number, changeCents?: number} | null | undefined} payment
 * @returns {string[]}
 */
function paymentLines(payment) {
  if (!payment) {
    return [];
  }
  if (payment.method === 'card') {
    return ['Tarjeta'];
  }
  if (payment.method === 'bizum') {
    return ['Bizum'];
  }
  if (payment.method === 'mixed' && Array.isArray(payment.parts)) {
    return ['Mixto'].concat(payment.parts.map(part =>
      partLabel(part.method) + ' ' + formatEuroCents(part.amountCents)
    ));
  }
  if (payment.method !== 'cash') {
    return [];
  }
  const lines = ['Efectivo'];
  if (Number.isInteger(payment.tenderedCents)) {
    lines.push('Entregado ' + formatEuroCents(payment.tenderedCents));
  }
  if (Number.isInteger(payment.changeCents)) {
    lines.push('Cambio ' + formatEuroCents(payment.changeCents));
  }
  return lines;
}

/**
 * @param {string | null | undefined} method
 * @returns {string}
 */
function partLabel(method) {
  if (method === 'card') {
    return 'Tarjeta';
  }
  if (method === 'bizum') {
    return 'Bizum';
  }
  return 'Efectivo';
}

function vatLabel(row) {
  if (row.kind === 'E') {
    return 'Exento ' + row.cause;
  }
  if (row.kind === 'N') {
    return 'No sujeto ' + row.cause;
  }
  return String(row.percent) + ' %';
}
