import {expect} from 'chai';
import EscPosReceiptRenderer from '../../../../openMarket/infrastructure/printer/EscPosReceiptRenderer';

describe('EscPosReceiptRenderer', () => {
  it('prints the QR with correction M before the shop header', () => {
    const calls = [];
    const printer = {
      alignCenter() { calls.push('alignCenter'); },
      alignLeft() { calls.push('alignLeft'); },
      alignRight() { calls.push('alignRight'); },
      bold() {},
      setTextDoubleHeight() {},
      setTextDoubleWidth() {},
      setTextNormal() {},
      println(text) { calls.push('println:' + text); },
      printQR(data, options) { calls.push('printQR:' + data + ':' + options.correction + ':' + options.model + ':' + options.cellSize); },
      drawLine() { calls.push('drawLine'); },
      newLine() { calls.push('newLine'); },
      cut() { calls.push('cut'); }
    };
    new EscPosReceiptRenderer({paperWidthMm: 80}).render(printer, {
      blocks: [
        {type: 'text', text: 'QR tributario:', align: 'center'},
        {type: 'qr', data: 'https://aeat.example/qr', sizeMm: 35, correction: 'M'},
        {type: 'text', text: 'Ultramarinos Pérez', align: 'center', bold: true, size: 'large'}
      ]
    });
    const qr = calls.findIndex(call => call.indexOf('printQR:') === 0);
    const header = calls.findIndex(call => call === 'println:Ultramarinos Pérez');
    expect(qr).to.be.above(-1);
    expect(qr).to.be.below(header);
    expect(calls[qr]).to.equal('printQR:https://aeat.example/qr:M:2:10');
  });

  it('passes 58 mm and 80 mm into the QR cell size', () => {
    const receipt = {
      blocks: [{type: 'qr', data: 'https://aeat.example/qr', sizeMm: 35, correction: 'M'}]
    };
    function cell(paperWidthMm) {
      const calls = [];
      const printer = {
        printQR(data, options) { calls.push(options.cellSize); },
        cut() {}
      };
      new EscPosReceiptRenderer().render(printer, receipt, {paperWidthMm});
      return calls[0];
    }
    expect(cell(80)).to.equal(10);
    expect(cell(58)).to.equal(14);
    const fallback = [];
    new EscPosReceiptRenderer({paperWidthMm: 58}).render({
      printQR(data, options) { fallback.push(options.cellSize); },
      cut() {}
    }, receipt);
    expect(fallback).to.deep.equal([14]);
  });
});
