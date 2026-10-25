import {expect} from 'chai';
import * as Rx from 'rxjs';
import OrderPrinterService from '../../../../openMarket/infrastructure/printer/OrderPrinterService';
import EscPosReceiptRenderer from '../../../../openMarket/infrastructure/printer/EscPosReceiptRenderer';
import SellPreferencesView from '../../../../openMarket/domain/shop/SellPreferencesView';

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

  it('renders the job with the stored paper width', () => {
    const widths = [];
    const connection = {
      print(fill) {
        fill({});
        return Rx.Observable.of(true);
      }
    };
    const renderer = {
      render(printer, receipt, options) {
        widths.push(options.paperWidthMm);
      }
    };
    function service(repository) {
      return new OrderPrinterService({
        printerConnection: connection,
        renderer,
        sellPreferencesRepository: repository
      });
    }
    const receipt = {blocks: [{type: 'text', text: 'Hola'}]};
    let finished = 0;
    service({
      find() {
        return Rx.Observable.of(new SellPreferencesView({paperWidthMm: 58}));
      }
    }).print({receipt}).subscribe(() => { finished += 1; });
    service(null).print({receipt}).subscribe(() => { finished += 1; });
    service({
      find() {
        return Rx.Observable.empty();
      }
    }).print({receipt}).subscribe(() => { finished += 1; });
    service({
      find() {
        return Rx.Observable.of(null);
      }
    }).print({receipt}).subscribe(() => { finished += 1; });
    expect(finished).to.equal(4);
    expect(widths).to.deep.equal([58, 80, 80, 80]);
  });
});
