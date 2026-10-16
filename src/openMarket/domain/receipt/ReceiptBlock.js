import InvalidReceiptBlockError from './InvalidReceiptBlockError';

const ALIGNS = ['left', 'center', 'right'];
const SIZES = ['normal', 'large'];

/**
 * Validates one receipt block and returns a frozen copy.
 * A QR is 30–40 mm with error correction M.
 * @param {*} input
 * @returns {object}
 */
export function receiptBlock(input) {
  if (!input || typeof input !== 'object') {
    throw new InvalidReceiptBlockError({type: ''});
  }
  if (input.type === 'text') {
    return freeze(textBlock(input));
  }
  if (input.type === 'qr') {
    return freeze(qrBlock(input));
  }
  if (input.type === 'line') {
    return freeze({type: 'line'});
  }
  if (input.type === 'feed') {
    return freeze(feedBlock(input));
  }
  throw new InvalidReceiptBlockError({type: String(input.type || '')});
}

/**
 * @param {*} input
 * @returns {object}
 */
function textBlock(input) {
  if (typeof input.text !== 'string') {
    throw new InvalidReceiptBlockError({type: 'text', field: 'text'});
  }
  const align = input.align == null ? 'left' : input.align;
  const size = input.size == null ? 'normal' : input.size;
  if (ALIGNS.indexOf(align) === -1) {
    throw new InvalidReceiptBlockError({type: 'text', field: 'align'});
  }
  if (SIZES.indexOf(size) === -1) {
    throw new InvalidReceiptBlockError({type: 'text', field: 'size'});
  }
  return {type: 'text', text: input.text, align, bold: input.bold === true, size};
}

/**
 * @param {*} input
 * @returns {object}
 */
function qrBlock(input) {
  const sizeMm = Number(input.sizeMm);
  if (typeof input.data !== 'string' || input.data.trim() === '') {
    throw new InvalidReceiptBlockError({type: 'qr', field: 'data'});
  }
  if (!Number.isInteger(sizeMm) || sizeMm < 30 || sizeMm > 40) {
    throw new InvalidReceiptBlockError({type: 'qr', field: 'sizeMm'});
  }
  if (input.correction !== 'M') {
    throw new InvalidReceiptBlockError({type: 'qr', field: 'correction'});
  }
  return {type: 'qr', data: input.data, sizeMm, correction: 'M'};
}

/**
 * @param {*} input
 * @returns {object}
 */
function feedBlock(input) {
  const lines = Number(input.lines);
  if (!Number.isInteger(lines) || lines < 1) {
    throw new InvalidReceiptBlockError({type: 'feed', field: 'lines'});
  }
  return {type: 'feed', lines};
}

/**
 * @param {object} value
 * @returns {object}
 */
function freeze(value) {
  return Object.freeze(value);
}
