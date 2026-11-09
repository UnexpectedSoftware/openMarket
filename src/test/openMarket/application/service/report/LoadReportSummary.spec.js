import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import OrderTakings from '../../../../../openMarket/domain/order/OrderTakings';
import ProductsQuery from '../../../../../openMarket/domain/product/ProductsQuery';
import LoadReportSummary from '../../../../../openMarket/application/service/report/LoadReportSummary';

const FROM = '2026-11-03 00:00:00';
const TO = '2026-11-09 23:59:59';

function takings(orders) {
  return OrderTakings.fromRows({orders, lines: [{quantityMilli: 1000}]});
}

describe('LoadReportSummary', () => {
  it('aligns both ranges, the top five, and the low-stock page', done => {
    const calls = [];
    let sold;
    let query;
    const useCase = new LoadReportSummary({
      orderRepository: {
        takings: range => {
          calls.push(range);
          const orders = range.from === FROM
            ? [{soldOn: '2026-11-04', totalCents: 500, method: 'card'}]
            : [{soldOn: '2026-10-28', totalCents: 250, method: 'cash'}];
          return Rx.Observable.of(takings(orders));
        }
      },
      productSaleStatisticsRepository: {
        mostSold: params => {
          sold = params;
          return [{barcode: '1', name: 'Milk', quantity: 2, amount: 1.5}];
        }
      },
      productRepository: {
        find: criteria => {
          query = criteria;
          return Rx.Observable.of({
            total: 4,
            items: [{barcode: '9', name: 'Bread', stock: 0, stockMin: 2, weighted: false}]
          });
        }
      }
    });

    useCase.load({from: FROM, to: TO}).subscribe(summary => {
      expect(calls).to.deep.equal([
        {from: FROM, to: TO},
        {from: '2026-10-27 00:00:00', to: '2026-11-02 23:59:59'}
      ]);
      expect(sold).to.deep.equal({startOn: '2026-11-03', endOn: '2026-11-09', limit: 5});
      expect(query).to.be.instanceof(ProductsQuery);
      expect(query.lowStock).to.equal(true);
      expect(query.status).to.equal('ENABLED');
      expect(query.sort).to.equal('stock_asc');
      expect(query.limit).to.equal(3);
      expect(summary.salesCents).to.equal(500);
      expect(summary.previousSalesCents).to.equal(250);
      expect(summary.salesChange).to.equal(1);
      expect(summary.units).to.equal(1);
      expect(summary.days).to.have.length(7);
      expect(summary.days[0]).to.deep.equal({
        date: '2026-11-03', cashCents: 0, cardCents: 0, bizumCents: 0, previousTotalCents: 250
      });
      expect(summary.days[1]).to.deep.equal({
        date: '2026-11-04', cashCents: 0, cardCents: 500, bizumCents: 0, previousTotalCents: 0
      });
      expect(summary.mostSold[0].amountCents).to.equal(150);
      expect(summary.lowStock.total).to.equal(4);
      expect(summary.lowStock.items[0].name).to.equal('Bread');
      done();
    }, done);
  });
});
