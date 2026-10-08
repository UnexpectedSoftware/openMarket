import {expect} from 'chai';
import * as Rx from 'rxjs';
import OrderPrinterService from '../../../../openMarket/infrastructure/printer/OrderPrinterService';

describe('OrderPrinterService', () => {
  it('still prints the shop receipt through the shared connection', () => {
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
          drawLine() {},
          newLine() { lines.push('\n'); },
          bold() {},
          print(text) { lines.push(String(text)); },
          println(text) { lines.push(String(text)); },
          tableCustom(cells) { lines.push(cells.map(cell => String(cell.text)).join('|')); },
          cut() { lines.push('cut'); }
        });
        return Rx.Observable.of(true);
      }
    };
    const service = new OrderPrinterService({printerConnection: connection});
    let done = false;
    service.print({
      order: {
        createdAt: '2026-10-08',
        total: 3,
        lines: [{name: 'Very long product name here', quantity: 2, price: 1.5, subtotal: 3}]
      }
    }).subscribe(() => { done = true; });
    expect(done).to.equal(true);
    expect(lines[0]).to.equal('SUPER COMPRIN');
    expect(lines).to.include('NIF 476359906P');
    expect(lines).to.include('Very long product n|2|1.5|3');
    expect(lines).to.include('IVA incluido');
    expect(lines[lines.length - 1]).to.equal('cut');
  });
});
