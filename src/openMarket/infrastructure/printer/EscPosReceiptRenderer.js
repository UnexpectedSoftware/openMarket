/**
 * Draws a receipt document on a thermal printer.
 * QR module size targets the block's millimetres on the paper width.
 */
export default class EscPosReceiptRenderer {

  /**
   * @param {{paperWidthMm?: number}} [options]
   */
  constructor({paperWidthMm = 80} = {}) {
    this._paperWidthMm = paperWidthMm;
  }

  /**
   * @param {*} printer
   * @param {{blocks?: object[]}} receipt
   * @param {{paperWidthMm?: number}} [options] Width for this job. Falls back to the renderer default.
   */
  render(printer, receipt, options) {
    const paperWidthMm = options && options.paperWidthMm != null ? options.paperWidthMm : this._paperWidthMm;
    /** @type {Array<*>} */
    const blocks = receipt && receipt.blocks ? receipt.blocks : [];
    blocks.forEach(block => {
      if (block.type === 'text') {
        this._text(printer, block);
      } else if (block.type === 'qr') {
        printer.printQR(block.data, {
          cellSize: cellSize(block.sizeMm, paperWidthMm),
          correction: 'M',
          model: 2
        });
      } else if (block.type === 'line') {
        printer.drawLine();
      } else if (block.type === 'feed') {
        for (let count = 0; count < block.lines; count += 1) {
          printer.newLine();
        }
      }
    });
    printer.cut();
  }

  /**
   * @param {*} printer
   * @param {{text: string, align?: string, bold?: boolean, size?: string}} block
   */
  _text(printer, block) {
    if (block.align === 'center' && printer.alignCenter) {
      printer.alignCenter();
    } else if (block.align === 'right' && printer.alignRight) {
      printer.alignRight();
    } else if (printer.alignLeft) {
      printer.alignLeft();
    }
    if (block.bold && printer.bold) {
      printer.bold(true);
    }
    if (block.size === 'large') {
      if (printer.setTextDoubleHeight) {
        printer.setTextDoubleHeight();
      }
      if (printer.setTextDoubleWidth) {
        printer.setTextDoubleWidth();
      }
    }
    printer.println(block.text);
    if (printer.setTextNormal) {
      printer.setTextNormal();
    }
    if (printer.bold) {
      printer.bold(false);
    }
  }

}

/**
 * 80 mm paper is about 576 dots wide. A small QR is 25 modules.
 * @param {number} sizeMm
 * @param {number} paperWidthMm
 * @returns {number}
 */
function cellSize(sizeMm, paperWidthMm) {
  const width = paperWidthMm > 0 ? paperWidthMm : 80;
  const dots = Math.round(sizeMm / width * 576);
  return Math.max(1, Math.min(16, Math.round(dots / 25)));
}
