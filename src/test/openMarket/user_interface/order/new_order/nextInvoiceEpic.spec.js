import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/toArray';
import {
  NEXT_INVOICE_LOADED,
  NEXT_INVOICE_REQUESTED
} from '../../../../../openMarket/user_interface/order/new_order/action';
import {makeNextInvoiceEpic} from '../../../../../openMarket/user_interface/order/new_order/epicFactory';

describe('makeNextInvoiceEpic', () => {
  it('stores the peeked number and stays quiet when the read fails', done => {
    const useCase = {peek: () => Rx.Observable.of('2026/000042')};
    makeNextInvoiceEpic(useCase)(Rx.Observable.of({type: NEXT_INVOICE_REQUESTED}))
      .toArray()
      .subscribe(actions => {
        expect(actions).to.deep.equal([{type: NEXT_INVOICE_LOADED, payload: '2026/000042'}]);
        makeNextInvoiceEpic({peek: () => Rx.Observable.throw(new Error('db'))})(
          Rx.Observable.of({type: NEXT_INVOICE_REQUESTED})
        ).toArray().subscribe(failed => {
          expect(failed).to.deep.equal([{type: NEXT_INVOICE_LOADED, payload: ''}]);
          makeNextInvoiceEpic(null)(Rx.Observable.of({type: NEXT_INVOICE_REQUESTED}))
            .toArray()
            .subscribe(missing => {
              expect(missing).to.deep.equal([{type: NEXT_INVOICE_LOADED, payload: ''}]);
              done();
            }, done);
        }, done);
      }, done);
  });
});
