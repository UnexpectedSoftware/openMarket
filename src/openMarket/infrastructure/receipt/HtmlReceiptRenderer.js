/**
 * One block from the shared receipt list.
 * @typedef {object} ReceiptViewBlock
 * @property {string} [type]
 * @property {string} [text]
 * @property {string} [data]
 * @property {number} [lines]
 * @property {string} [align]
 * @property {boolean} [bold]
 * @property {string} [size]
 */

/**
 * The same receipt blocks as the thermal renderer, as an HTML string.
 * Text is escaped. Colours and type come from `--om-*` tokens.
 */
export default class HtmlReceiptRenderer {

  /**
   * @param {{blocks?: ReceiptViewBlock[]} | null | undefined} receipt
   * @returns {string}
   */
  render(receipt) {
    const blocks = receipt && receipt.blocks ? receipt.blocks : [];
    const body = blocks.map(block => renderBlock(block)).join('');
    return '<article class="om-receipt" style="' + ARTICLE_STYLE + '">' + body + '</article>';
  }

}

const ARTICLE_STYLE = [
  'font-family:var(--om-font-mono)',
  'color:var(--om-color-text)',
  'background:var(--om-color-surface)',
  'padding:var(--om-space-3)',
  'border:var(--om-button-border-width) solid var(--om-color-border)',
  'border-radius:var(--om-radius-md)'
].join(';');

/**
 * @param {ReceiptViewBlock} block
 * @returns {string}
 */
function renderBlock(block) {
  if (!block || typeof block !== 'object') {
    return '';
  }
  if (block.type === 'text') {
    return textBlock(block);
  }
  if (block.type === 'qr') {
    return '<div class="om-receipt-qr" style="' + QR_STYLE + '">' + escapeHtml(block.data) + '</div>';
  }
  if (block.type === 'line') {
    return '<hr class="om-receipt-rule" style="border:0;border-top:var(--om-button-border-width) solid var(--om-color-border);margin:var(--om-space-2) 0" />';
  }
  if (block.type === 'feed') {
    const lines = Number(block.lines) || 0;
    let html = '';
    for (let count = 0; count < lines; count += 1) {
      html += '<div class="om-receipt-feed" style="height:var(--om-space-3)"></div>';
    }
    return html;
  }
  return '';
}

const QR_STYLE = [
  'text-align:center',
  'font-family:var(--om-font-mono)',
  'font-size:var(--om-font-size-xs)',
  'padding:var(--om-space-3)',
  'border:var(--om-button-border-width) dashed var(--om-color-border)',
  'margin:var(--om-space-2) 0'
].join(';');

/**
 * @param {{text?: string, align?: string, bold?: boolean, size?: string}} block
 * @returns {string}
 */
function textBlock(block) {
  const align = block.align === 'center' || block.align === 'right' ? block.align : 'left';
  const parts = [
    'margin:0',
    'white-space:pre-wrap',
    'text-align:' + align,
    'font-size:' + (block.size === 'large' ? 'var(--om-font-size-lg)' : 'var(--om-font-size-sm)')
  ];
  if (block.bold) {
    parts.push('font-weight:var(--om-font-weight-bold)');
  }
  return '<p class="om-receipt-text" style="' + parts.join(';') + '">' + escapeHtml(block.text) + '</p>';
}

/**
 * @param {*} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
