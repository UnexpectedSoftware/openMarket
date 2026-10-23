import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/throw';
import OrderRangeSummary from '../../../../../openMarket/domain/order/OrderRangeSummary';
import OrdersQuery from '../../../../../openMarket/domain/order/OrdersQuery';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toArray';
import {
  ORDER_DETAIL_FAILED,
  ORDER_DETAIL_LOADED,
  ORDER_DETAIL_REQUESTED,
  ORDER_REPRINT_CONFIRMED,
  ORDER_REPRINT_FAILED,
  ORDER_REPRINT_FINISHED,
  ORDER_REPRINT_PREVIEW_LOADED,
  ORDER_REPRINT_REQUESTED,
  ORDERS_FAILED,
  ORDERS_LOADED,
  ORDERS_RANGE_SELECTED,
  ORDERS_SUMMARY_LOADED
} from '../../../../../openMarket/user_interface/order/list_orders/action';
import {
  makeOrderDetailEpic,
  makeOrderPrintEpic,
  makeOrderReprintEpic,
  makeOrdersListEpic
} from '../../../../../openMarket/user_interface/order/list_orders/epicFactory';

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

describe('makeOrderDetailEpic', () => {
  it('reads one order by id and reports a miss as null', done => {
    const orders = {
      find: query => {
        expect(query).to.deep.equal({id: 'missing'});
        return Rx.Observable.of(null);
      }
    };
    makeOrderDetailEpic(orders)(Rx.Observable.of({type: ORDER_DETAIL_REQUESTED, id: 'missing'}))
      .toArray()
      .subscribe(
        actions => {
          expect(actions).to.deep.equal([{type: ORDER_DETAIL_LOADED, id: 'missing', detail: null}]);
          done();
        },
        error => done(error)
      );
  });

  it('keeps the latest id when a slower read finishes later', () => {
    const first = new Rx.Subject();
    let calls = 0;
    const orders = {
      find: () => {
        calls += 1;
        return calls === 1 ? first : Rx.Observable.of({orderId: 'second'});
      }
    };
    const actions = new Rx.Subject();
    const seen = [];
    const subscription = makeOrderDetailEpic(orders)(actions).subscribe(action => seen.push(action));
    actions.next({type: ORDER_DETAIL_REQUESTED, id: 'first'});
    actions.next({type: ORDER_DETAIL_REQUESTED, id: 'second'});
    expect(seen).to.deep.equal([{type: ORDER_DETAIL_LOADED, id: 'second', detail: {orderId: 'second'}}]);
    first.next({orderId: 'first'});
    first.complete();
    expect(seen).to.have.lengthOf(1);
    subscription.unsubscribe();
  });

  it('reports a failure for that id', done => {
    const failure = new Error('db down');
    failure.userMessage = 'No se ha podido abrir el pedido';
    const orders = {find: () => Rx.Observable.throw(failure)};
    makeOrderDetailEpic(orders)(Rx.Observable.of({type: ORDER_DETAIL_REQUESTED, id: 'a'}))
      .toArray()
      .subscribe(
        actions => {
          expect(actions).to.deep.equal([{
            type: ORDER_DETAIL_FAILED,
            id: 'a',
            message: 'No se ha podido abrir el pedido'
          }]);
          done();
        },
        error => done(error)
      );
  });
});

describe('order reprint epics', () => {
  it('loads the ticket HTML', done => {
    const build = {
      build: ({orderId}) => Rx.Observable.of({html: '<p>' + orderId + '</p>', blocks: []})
    };
    makeOrderReprintEpic(build)(Rx.Observable.of({type: ORDER_REPRINT_REQUESTED, orderId: 'a'}))
      .toArray()
      .subscribe(
        actions => {
          expect(actions).to.deep.equal([{
            type: ORDER_REPRINT_PREVIEW_LOADED,
            orderId: 'a',
            html: '<p>a</p>'
          }]);
          done();
        },
        error => done(error)
      );
  });

  it('reports a preview failure', done => {
    const failure = new Error('no ticket');
    const build = {build: () => Rx.Observable.throw(failure)};
    makeOrderReprintEpic(build)(Rx.Observable.of({type: ORDER_REPRINT_REQUESTED, orderId: 'a'}))
      .toArray()
      .subscribe(
        actions => {
          expect(actions[0].type).to.equal(ORDER_REPRINT_FAILED);
          expect(actions[0].orderId).to.equal('a');
          expect(actions[0].message).to.equal('no ticket');
          done();
        },
        error => done(error)
      );
  });

  it('prints the built receipt', done => {
    let printed = null;
    const build = {
      build: () => Rx.Observable.of({html: '<p>a</p>', blocks: [{kind: 'text'}]})
    };
    const print = {
      print: ({receipt}) => {
        printed = receipt;
        return Rx.Observable.of(true);
      }
    };
    makeOrderPrintEpic(build, print)(Rx.Observable.of({type: ORDER_REPRINT_CONFIRMED, orderId: 'a'}))
      .toArray()
      .subscribe(
        actions => {
          expect(printed.blocks).to.deep.equal([{kind: 'text'}]);
          expect(actions).to.deep.equal([{type: ORDER_REPRINT_FINISHED, orderId: 'a'}]);
          done();
        },
        error => done(error)
      );
  });

  it('reports a print failure', done => {
    const build = {build: () => Rx.Observable.of({html: '', blocks: []})};
    const print = {print: () => Rx.Observable.throw(new Error('printer'))};
    makeOrderPrintEpic(build, print)(Rx.Observable.of({type: ORDER_REPRINT_CONFIRMED, orderId: 'a'}))
      .toArray()
      .subscribe(
        actions => {
          expect(actions[0].type).to.equal(ORDER_REPRINT_FAILED);
          expect(actions[0].message).to.equal('printer');
          done();
        },
        error => done(error)
      );
  });
});
