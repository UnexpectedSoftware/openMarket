import {expect} from 'chai';
import * as Rx from 'rxjs';
import OrderPrinterService from '../../../../openMarket/infrastructure/printer/OrderPrinterService';
import EscPosReceiptRenderer from '../../../../openMarket/infrastructure/printer/EscPosReceiptRenderer';

describe('OrderPrinterService', () => {
  it('prints the receipt blocks and nothing else', () => {
    const lines = [];
    const connection = {
      print(fill) {
        fill({
          alignCenter() {},
          alignLeft() {},
          alignRight() {},
          setTextDoubleHeight() {},
          setTextDoubleWidth() {},
          setTextNormal() {},
          bold() {},
          println(text) { lines.push(String(text)); },
          printQR(data, options) { lines.push('qr:' + data + ':' + options.correction); },
          drawLine() {},
          newLine() {},
          cut() { lines.push('cut'); }
        });
        return Rx.Observable.of(true);
      }
    };
    const service = new OrderPrinterService({
      printerConnection: connection,
      renderer: new EscPosReceiptRenderer()
    });
    let done = false;
    service.print({
      receipt: {
        blocks: [
          {type: 'qr', data: 'https://aeat.example/qr', sizeMm: 35, correction: 'M'},
          {type: 'text', text: 'Ultramarinos Pérez', align: 'center', bold: true, size: 'large'}
        ]
      }
    }).subscribe(() => { done = true; });
    expect(done).to.equal(true);
    expect(lines[0]).to.equal('qr:https://aeat.example/qr:M');
    expect(lines[1]).to.equal('Ultramarinos Pérez');
    expect(lines[lines.length - 1]).to.equal('cut');
  });
});
