import {expect} from 'chai';
import * as Rx from 'rxjs';
import InvoiceNumber from '../../../../../openMarket/domain/invoice/InvoiceNumber';
import PeekNextInvoiceNumber from '../../../../../openMarket/application/service/invoice/PeekNextInvoiceNumber';

describe('PeekNextInvoiceNumber', () => {
  it('peeks the shop year and does not call next', done => {
    let peeked = null;
    let allocated = false;
    const useCase = new PeekNextInvoiceNumber({
      invoiceSequence: {
        peek({series}) {
          peeked = series;
          return Rx.Observable.of(new InvoiceNumber({series, number: 42}));
        },
        next() {
          allocated = true;
          return Rx.Observable.of(new InvoiceNumber({series: '2026', number: 1}));
        }
      },
      clock: {zonedNow: () => ({date: '2026-11-01', local: '2026-11-01T23:17:00+01:00'})}
    });
    useCase.peek().subscribe(number => {
      expect(peeked).to.equal('2026');
      expect(number).to.equal('2026/000042');
      expect(allocated).to.equal(false);
      done();
    }, done);
  });
});
