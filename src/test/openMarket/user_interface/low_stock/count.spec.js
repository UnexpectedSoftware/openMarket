import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/operator/toArray';
import ProductEnabledAgain from '../../../../openMarket/domain/event/ProductEnabledAgain';
import ProductWithLowStock from '../../../../openMarket/domain/event/ProductWithLowStock';
import {deliveringDomainEventBus} from '../../support/domainEventBus';
import {PRODUCTS_SAVED} from '../../../../openMarket/user_interface/product/list_products/action';
import {
  LOW_STOCK_COUNT_FAILED,
  LOW_STOCK_COUNT_LOADED,
  LOW_STOCK_COUNT_REQUESTED,
  lowStockCountRequested
} from '../../../../openMarket/user_interface/low_stock/action';
import {makeLowStockCountEpic, makeLowStockCountRefreshEpic} from '../../../../openMarket/user_interface/low_stock/epicFactory';
import {failed, loaded, requested, state} from '../../../../openMarket/user_interface/low_stock/model';
import reducer from '../../../../openMarket/user_interface/low_stock/reducer';

describe('low stock count', () => {
  it('keeps the last count when a refresh fails and hides a zero', () => {
    expect(state()).to.deep.equal({count: null, status: 'idle'});
    const loading = requested(state());
    expect(loading.status).to.equal('loading');
    expect(loading.count).to.equal(null);
    const ready = loaded(loading, 2);
    expect(ready).to.deep.equal({count: 2, status: 'ready'});
    expect(loaded(ready, 0).count).to.equal(0);
    expect(loaded(ready, -3).count).to.equal(0);
    expect(loaded(ready, Number.NaN).count).to.equal(0);
    expect(loaded(ready, 2.8).count).to.equal(2);
    const broken = failed(ready);
    expect(broken.count).to.equal(2);
    expect(broken.status).to.equal('error');
    expect(failed(null)).to.deep.equal({count: null, status: 'error'});
  });

  it('delegates the reducer to the model', () => {
    const initial = reducer(undefined, {type: 'OTHER'});
    expect(initial).to.deep.equal(state());
    const loading = reducer(initial, lowStockCountRequested());
    expect(loading.status).to.equal('loading');
    const ready = reducer(loading, {type: LOW_STOCK_COUNT_LOADED, count: 1});
    expect(ready.count).to.equal(1);
    expect(reducer(ready, {type: LOW_STOCK_COUNT_FAILED}).count).to.equal(1);
    expect(reducer(ready, {type: LOW_STOCK_COUNT_REQUESTED}).count).to.equal(1);
  });

  it('loads the count and reports a failure without dropping a newer request', done => {
    const statistics = {
      countProductsWithLowStock() {
        return Rx.Observable.of(3);
      }
    };
    makeLowStockCountEpic(statistics)(Rx.Observable.of(lowStockCountRequested()))
      .toArray()
      .subscribe(actions => {
        expect(actions).to.deep.equal([{type: LOW_STOCK_COUNT_LOADED, count: 3}]);
        const failing = {
          countProductsWithLowStock() {
            return Rx.Observable.throw(new Error('db'));
          }
        };
        makeLowStockCountEpic(failing)(Rx.Observable.of({type: LOW_STOCK_COUNT_REQUESTED}))
          .toArray()
          .subscribe(failedActions => {
            expect(failedActions).to.deep.equal([{type: LOW_STOCK_COUNT_FAILED}]);
            done();
          }, done);
      }, done);
  });

  it('asks again after a low-stock sale, a re-enable, and a product save', done => {
    const bus = deliveringDomainEventBus();
    const actions = new Rx.Subject();
    const seen = [];
    const subscription = makeLowStockCountRefreshEpic(bus)(actions).subscribe(action => seen.push(action));
    actions.next({type: 'UNRELATED'});
    actions.next({type: PRODUCTS_SAVED});
    bus.record(new ProductWithLowStock({barcode: '1', name: 'Milk', stock: 1, stockMin: 1}));
    bus.record(new ProductEnabledAgain({barcode: '2', name: 'Bread'}));
    bus.raise();
    expect(seen).to.deep.equal([
      lowStockCountRequested(),
      lowStockCountRequested(),
      lowStockCountRequested()
    ]);
    subscription.unsubscribe();
    done();
  });
});
