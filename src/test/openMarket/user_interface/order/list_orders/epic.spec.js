import {expect} from 'chai';
import * as Rx from 'rxjs';
import OrderRangeSummary from '../../../../../openMarket/domain/order/OrderRangeSummary';
import OrdersQuery from '../../../../../openMarket/domain/order/OrdersQuery';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toArray';
import {
  ORDERS_FAILED,
  ORDERS_LOADED,
  ORDERS_RANGE_SELECTED,
  ORDERS_SUMMARY_LOADED
} from '../../../../../openMarket/user_interface/order/list_orders/action';
import {makeOrdersListEpic} from '../../../../../openMarket/user_interface/order/list_orders/epicFactory';

const summary = {totalCents: 200, ticketCount: 1, averageCents: 200};

function range(key, append) {
  return {
    type: ORDERS_RANGE_SELECTED,
    key,
    from: '2026-10-21 00:00:00',
    to: '2026-10-21 23:59:59',
    offset: append ? 20 : 0,
    limit: 20,
    append
  };
}

describe('makeOrdersListEpic', () => {
  it('loads the page and the summary for the latest range', done => {
    let criteria;
    const orders = {
      find: query => {
        criteria = query;
        return Rx.Observable.of({items: [{orderId: 'a'}], total: 1});
      },
      summary: () => Rx.Observable.of(summary)
    };
    makeOrdersListEpic(orders)(Rx.Observable.of(range('today', false)))
      .toArray()
      .subscribe(
        actions => {
          expect(criteria).to.be.instanceof(OrdersQuery);
          expect(criteria.from).to.equal('2026-10-21 00:00:00');
          expect(criteria.to).to.equal('2026-10-21 23:59:59');
          expect(criteria.limit).to.equal(20);
          expect(criteria.offset).to.equal(0);
          expect(actions.map(action => action.type)).to.deep.equal([ORDERS_LOADED, ORDERS_SUMMARY_LOADED]);
          expect(actions[0].items).to.deep.equal([{orderId: 'a'}]);
          expect(actions[0].append).to.equal(false);
          expect(actions[1].ticketCount).to.equal(1);
        },
        error => done(error),
        () => done()
      );
  });

  it('copies summary fields from the read model', done => {
    const orders = {
      find: () => Rx.Observable.of({items: [], total: 0}),
      summary: () => Rx.Observable.of(new OrderRangeSummary({totalCents: 201, ticketCount: 2}))
    };
    makeOrdersListEpic(orders)(Rx.Observable.of(range('today', false)))
      .toArray()
      .subscribe(
        actions => {
          expect(actions[1].totalCents).to.equal(201);
          expect(actions[1].ticketCount).to.equal(2);
          expect(actions[1].averageCents).to.equal(101);
        },
        error => done(error),
        () => done()
      );
  });

  it('marks an appended page', done => {
    const orders = {
      find: () => Rx.Observable.of({items: [{orderId: 'b'}], total: 40}),
      summary: () => Rx.Observable.of(summary)
    };
    makeOrdersListEpic(orders)(Rx.Observable.of(range('today', true)))
      .toArray()
      .subscribe(
        actions => {
          expect(actions[0].append).to.equal(true);
          expect(actions[0].total).to.equal(40);
        },
        error => done(error),
        () => done()
      );
  });

  it('drops a slower range when a newer one arrives', () => {
    const first = new Rx.Subject();
    let calls = 0;
    const orders = {
      find: () => {
        calls += 1;
        return calls === 1 ? first : Rx.Observable.of({items: [{orderId: 'second'}], total: 1});
      },
      summary: () => Rx.Observable.of(summary)
    };
    const actions = new Rx.Subject();
    const seen = [];
    const subscription = makeOrdersListEpic(orders)(actions).subscribe(action => seen.push(action));
    actions.next(range('today', false));
    actions.next(range('yesterday', false));
    expect(seen.map(action => action.type)).to.deep.equal([ORDERS_LOADED, ORDERS_SUMMARY_LOADED]);
    expect(seen[0].items[0].orderId).to.equal('second');
    first.next({items: [{orderId: 'first'}], total: 1});
    first.complete();
    expect(seen).to.have.lengthOf(2);
    subscription.unsubscribe();
  });

  it('reports a failure and does not load the page', done => {
    const failure = new Error('db down');
    failure.userMessage = 'No se han podido cargar los pedidos';
    const orders = {
      find: () => Rx.Observable.throw(failure),
      summary: () => Rx.Observable.of(summary)
    };
    makeOrdersListEpic(orders)(Rx.Observable.of(range('today', false)))
      .toArray()
      .subscribe(
        actions => {
          expect(actions).to.deep.equal([{
            type: ORDERS_FAILED,
            message: 'No se han podido cargar los pedidos'
          }]);
        },
        error => done(error),
        () => done()
      );
  });
});
