import {expect} from 'chai';
import * as Rx from 'rxjs';
import {
  PRODUCT_SALES_LOADED,
  PRODUCT_SALES_WINDOW_SELECTED
} from '../../../../../openMarket/user_interface/product/new_product/action';
import {makeProductSalesEpic} from '../../../../../openMarket/user_interface/product/new_product/epicFactory';

describe('Product sales epic', () => {
  function salesOf(result) {
    const calls = [];
    const salesOfProduct = ({barcode, window}) => {
      calls.push({barcode, window});
      return Rx.Observable.of(result(window));
    };
    return {calls, salesOfProduct};
  }

  it('loads the window the cashier picked', (done) => {
    const {calls, salesOfProduct} = salesOf(window => ({
      window,
      quantity: 0,
      amount: 0,
      series: []
    }));
    const actions$ = Rx.Observable.of({
      type: PRODUCT_SALES_WINDOW_SELECTED,
      barcode: '0009',
      window: 'year'
    });

    makeProductSalesEpic(salesOfProduct)(actions$)
      .subscribe(
        action => {
          expect(calls).to.deep.equal([{barcode: '0009', window: 'year'}]);
          expect(action.type).to.equal(PRODUCT_SALES_LOADED);
          expect(action.payload.window).to.equal('year');
        },
        error => done(new Error(error)),
        () => done()
      );
  });
});
