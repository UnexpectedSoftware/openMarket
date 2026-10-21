import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';
import ListAllOrders from '../../../../../openMarket/application/service/order/ListAllOrders';
import OrderView from '../../../../../openMarket/domain/order/OrderView';
import OrdersQuery from '../../../../../openMarket/domain/order/OrdersQuery';
import OrderRangeSummary from '../../../../../openMarket/domain/order/OrderRangeSummary';

describe('ListAllOrders range', () => {
  it('reads the page and the summary through the repository', done => {
    const view = new OrderView({
      orderId: 'a',
      invoiceNumber: '2026/000001',
      createdAt: '2026-10-21T10:00:00',
      itemCount: 1,
      paymentMethod: 'cash',
      totalCents: 200,
      cancelled: false
    });
    const query = new OrdersQuery({from: 'a', to: 'b', limit: 20, offset: 0});
    const summary = new OrderRangeSummary({totalCents: 200, ticketCount: 1});
    const repository = {
      find: received => {
        expect(received).to.equal(query);
        return Rx.Observable.of({items: [view], total: 1});
      },
      summary: query => {
        expect(query).to.deep.equal({from: 'a', to: 'b'});
        return Rx.Observable.of(summary);
      }
    };
    const useCase = new ListAllOrders({repository});
    useCase.find(query)
      .mergeMap(page => useCase.summary({from: 'a', to: 'b'}).map(found => ({page, found})))
      .subscribe(
        ({page, found}) => {
          expect(page.items[0]).to.equal(view);
          expect(page.total).to.equal(1);
          expect(found).to.equal(summary);
        },
        error => done(error),
        () => done()
      );
  });
});
