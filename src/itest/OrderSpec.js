import la from 'lazy-ass';
import openMarket from '../openMarket/application/index';
import moment from "moment";
import { expect } from 'chai';
import sinon from 'sinon';
import * as Rx from 'rxjs';
import container from '../openMarket/infrastructure/dic/Container';
import { replaceSqliteData } from '../openMarket/infrastructure/service/sqliteSeed';
import ProductWithLowStock from '../openMarket/domain/event/ProductWithLowStock';
import OrderCreated from '../openMarket/domain/event/OrderCreated';

const database = container.getInstance({key: 'sqliteConnection'}).database;

/**
 * Howto
 * https://glebbahmutov.com/blog/testing-reactive-code/
 */

/**
 * @type {CreateOrder}
 */
const observableCreateOrder = openMarket.get('orders_create_use_case');
const observableFindOrders = openMarket.get('orders_list_all_use_case');
const orderStatisticsUseCase = openMarket.get('orders_statistics_use_case');
/**
 *
 * @type {FindProduct}
 */
const observableFindProducts = openMarket.get('products_find_use_case');
const domainEventBus = openMarket.get('domain_event_bus');

afterEach(function () {
  replaceSqliteData(database, {});


});

describe('Order create use case', () => {

  beforeEach(function () {
    const orderData = [
      {"_id":"01","_createdAt":"01/07/2017 17:53:04","_lines":[{"barcode":"0001","name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55}
    ];
    const productData = [
      {"_id":"Seq-0","_barcode":"0001","_name":"Coca-Cola","_description":"","_price":0.55,"_basePrice":0.3,"_stock":100,"_stockMin":10,"_imageUrl":"a","_categoryId":"1","_status":"ENABLED"},
      {"_id":"Seq-1","_barcode":"0002","_name":"Coca-Cola Zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1500,"_stockMin":10,"_imageUrl":"a","_categoryId":"2","_status":"ENABLED"}
    ];

    replaceSqliteData(database, {orders: orderData, products: productData});
  });
  describe('When save an order', () => {
    it('should create a new order and then would be 2 Orders on DB', (done) => {
      const lines = [{
        barcode: "0001",
        name: "Coca-Cola",
        price: 0.55,
        quantity: 5
      }];
      const spyNext = sinon.spy();

      observableCreateOrder.createOrder({
        lines: lines
      })
        .flatMap(saved => observableFindProducts.findProductByBarcode({barcode: '0001'}))
        .subscribe(
          (product) => {
            expect(product.stock).to.equal(95);
            spyNext();
          },
          (error) => done(new Error(error)),
          () => {
            expect(spyNext.called).to.be.true;
            done();
          }
        );
    });
  });

  describe('When save an order that leaves stock at the minimum', () => {
    it('publishes ProductWithLowStock and stores the remaining stock', (done) => {
      const events = [];
      const subscription = domainEventBus.ofType(ProductWithLowStock)
        .subscribe(event => events.push(event));
      const lines = [{
        barcode: "0001",
        name: "Coca-Cola",
        price: 0.55,
        quantity: 90
      }];

      observableCreateOrder.createOrder({lines})
        .flatMap(order => observableFindProducts.findProductByBarcode({barcode: '0001'})
          .map(product => ({order, product})))
        .subscribe(
          ({order, product}) => {
            expect(order.lines).to.have.lengthOf(1);
            expect(product.stock).to.equal(10);
            expect(events).to.have.lengthOf(1);
            expect(events[0]).to.be.instanceof(ProductWithLowStock);
            expect(events[0].barcode).to.equal('0001');
            expect(events[0].name).to.equal('Coca-Cola');
            expect(events[0].stock).to.equal(10);
            expect(events[0].stockMin).to.equal(10);
          },
          (error) => {
            subscription.unsubscribe();
            done(new Error(error));
          },
          () => {
            subscription.unsubscribe();
            done();
          }
        );
    });
  });

  describe('When save an order that leaves stock above the minimum', () => {
    it('publishes nothing and stores the remaining stock', (done) => {
      const events = [];
      const subscription = domainEventBus.ofType(ProductWithLowStock)
        .subscribe(event => events.push(event));
      const lines = [{
        barcode: "0001",
        name: "Coca-Cola",
        price: 0.55,
        quantity: 5
      }];

      observableCreateOrder.createOrder({lines})
        .flatMap(() => observableFindProducts.findProductByBarcode({barcode: '0001'}))
        .subscribe(
          (product) => {
            expect(product.stock).to.equal(95);
            expect(events).to.deep.equal([]);
          },
          (error) => {
            subscription.unsubscribe();
            done(new Error(error));
          },
          () => {
            subscription.unsubscribe();
            done();
          }
        );
    });
  });

  describe('When the sale commits', () => {
    it('publishes OrderCreated after the transaction commits', (done) => {
      const seen = [];
      const publish = domainEventBus.publish.bind(domainEventBus);
      const restore = () => {
        domainEventBus.publish = publish;
      };
      domainEventBus.publish = function publishEvent(event) {
        if (event instanceof OrderCreated) {
          seen.push(database.isTransaction);
        }
        return publish(event);
      };
      const lines = [{
        barcode: "0001",
        name: "Coca-Cola",
        price: 0.55,
        quantity: 5
      }];
      const ordersBefore = Number(database.prepare('SELECT count(*) AS total FROM "order"').get().total);
      let failed = false;

      observableCreateOrder.createOrder({lines})
        .subscribe(
          () => {
            try {
              expect(seen).to.deep.equal([false]);
              expect(Number(database.prepare('SELECT count(*) AS total FROM "order"').get().total)).to.equal(ordersBefore + 1);
              expect(Number(database.prepare('SELECT stock FROM product WHERE barcode = ?').get('0001').stock)).to.equal(95);
            } catch (error) {
              failed = true;
              restore();
              done(error);
            }
          },
          (error) => {
            restore();
            done(error);
          },
          () => {
            restore();
            if (!failed) {
              done();
            }
          }
        );
    });
  });

  describe('When the stock write fails', () => {
    let productRepository;
    let originalSave;

    beforeEach(() => {
      productRepository = container.getInstance({key: 'productRepository'});
      originalSave = productRepository.save;
      productRepository.save = function save({product}) {
        return originalSave.call(productRepository, {product})
          .flatMap(() => Rx.Observable.throw(new Error('stock write failed')));
      };
    });

    afterEach(() => {
      productRepository.save = originalSave;
    });

    it('rolls the order and the stock change back', (done) => {
      const lines = [{
        barcode: "0001",
        name: "Coca-Cola",
        price: 0.55,
        quantity: 5
      }];
      const ordersBefore = Number(database.prepare('SELECT count(*) AS total FROM "order"').get().total);
      const linesBefore = Number(database.prepare('SELECT count(*) AS total FROM line').get().total);
      const events = [];
      const subscription = domainEventBus.ofType(OrderCreated).subscribe(event => events.push(event));

      observableCreateOrder.createOrder({lines})
        .subscribe(
          () => {
            subscription.unsubscribe();
            done(new Error('should not emit an order'));
          },
          () => {
            subscription.unsubscribe();
            try {
              expect(Number(database.prepare('SELECT count(*) AS total FROM "order"').get().total)).to.equal(ordersBefore);
              expect(Number(database.prepare('SELECT count(*) AS total FROM line').get().total)).to.equal(linesBefore);
              expect(Number(database.prepare('SELECT stock FROM product WHERE barcode = ?').get('0001').stock)).to.equal(100);
              expect(database.isTransaction).to.equal(false);
              expect(events).to.have.lengthOf(0);
              done();
            } catch (error) {
              done(error);
            }
          }
        );
    });
  });

  describe('When save an order with empty lines', () => {
    it('should throw an exception', (done) => {
      const lines = [];
      observableCreateOrder.createOrder({
        lines: lines
      })
        .subscribe(
          (data) => {
            done(new Error('shouldnt be called'))
          },
          (error) => {
            done();
          },
          () => {
            done(new Error('shouldnt be called'))
          }
        );
    });
  });

});

describe('Order find use case by dates', () => {

  beforeEach(function () {
    const data = [
      {"_id":"01","_createdAt":"01/07/2017 17:53:04","_lines":[{"barcode":"0001","name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"01","_createdAt":"02/07/2017 17:53:04","_lines":[{"barcode":"0002","name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"01","_createdAt":"03/07/2017 17:53:04","_lines":[{"barcode":"0003","name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55}
    ];
    replaceSqliteData(database, {orders: data});
  });


  it('should find 1 order between given dates', (done) => {

    const givenStartDate = moment('01/07/2017 17:53:04','DD/MM/YYYY HH:mm:ss');
    const givenEndDate = moment('01/07/2017 23:59:59','DD/MM/YYYY HH:mm:ss');

    const spyNext = sinon.spy();
    observableFindOrders.findAllByDates({
      startDate: givenStartDate,
      endDate: givenEndDate,
      limit: 10,
      offset: 0
    })
      .subscribe(
        (orderArray) => {
          expect(orderArray[0]).to.deep.equals({id:'01',createdAt:'01/07/2017 17:53:04',total:0.55});
          spyNext();
        },
        (error) => done(new Error(error)),
        () => {
          expect(spyNext.called).to.be.true;
          done();
        }
      );

  });
  it('shouldn\'t find any order between given dates', (done) => {

    const givenStartDate = moment('01/06/2017 17:53:04','DD/MM/YYYY HH:mm:ss');
    const givenEndDate = moment('02/06/2017 17:53:04','DD/MM/YYYY HH:mm:ss');
    const spyNext = sinon.spy();

    observableFindOrders.findAllByDates({
      startDate: givenStartDate,
      endDate: givenEndDate,
      limit: 10,
      offset: 0
    })
      .subscribe(
        (orderArray) => {
          expect(orderArray).to.be.empty;
          spyNext();
        },
        (error) => done(new Error(error)),
        () => {
          expect(spyNext.called).to.be.true;
          done();
        }
      );

  });

  it('should find one order with given limit and offset', (done) => {

    const givenStartDate = moment('01/07/2017 17:53:04','DD/MM/YYYY HH:mm:ss');
    const givenEndDate = moment('31/07/2017 17:53:04','DD/MM/YYYY HH:mm:ss');
    const spyNext = sinon.spy();

    observableFindOrders.findAllByDates({
      startDate: givenStartDate,
      endDate: givenEndDate,
      limit: 1,
      offset: 1
    })
      .subscribe(
        (orderArray) => {
          expect(orderArray).to.have.lengthOf(1);
          spyNext();
        },
        (error) => done(new Error(error)),
        () => {
          expect(spyNext.called).to.be.true;
          done();
        }
      );

  });


});


describe('Order statistics', () => {
  describe('when calculate total amount by days', () => {

    beforeEach(function () {
      const data = [
        {
          "_id": "01",
          "_createdAt": "01/07/2017 13:53:04",
          "_lines": [{"barcode": "0001", "name": "Coca-Cola", "price": 0.55, "quantity": 1}],
          "_total": 0.55
        },
        {
          "_id": "01",
          "_createdAt": "01/07/2017 14:53:04",
          "_lines": [{"barcode": "0001", "name": "Coca-Cola", "price": 0.55, "quantity": 1}],
          "_total": 0.55
        },
        {
          "_id": "01",
          "_createdAt": "01/07/2017 17:53:04",
          "_lines": [{"barcode": "0001", "name": "Coca-Cola", "price": 0.55, "quantity": 1}],
          "_total": 0.55
        },
        {
          "_id": "01",
          "_createdAt": "01/07/2017 19:53:04",
          "_lines": [{"barcode": "0001", "name": "Coca-Cola", "price": 0.55, "quantity": 1}],
          "_total": 0.55
        },
        {
          "_id": "01",
          "_createdAt": "02/07/2017 17:53:04",
          "_lines": [{"barcode": "0002", "name": "Coca-Cola", "price": 0.55, "quantity": 1}],
          "_total": 0.55
        },
        {
          "_id": "01",
          "_createdAt": "02/07/2017 17:53:04",
          "_lines": [{"barcode": "0002", "name": "Coca-Cola", "price": 0.55, "quantity": 1}],
          "_total": 0.55
        },
        {
          "_id": "01",
          "_createdAt": "03/07/2017 17:53:04",
          "_lines": [{"barcode": "0003", "name": "Coca-Cola", "price": 0.55, "quantity": 1}],
          "_total": 0.55
        },
        {
          "_id": "01",
          "_createdAt": "03/07/2017 17:53:04",
          "_lines": [{"barcode": "0003", "name": "Coca-Cola", "price": 0.55, "quantity": 1}],
          "_total": 0.55
        },
        {
          "_id": "01",
          "_createdAt": "03/07/2017 17:53:04",
          "_lines": [{"barcode": "0003", "name": "Coca-Cola", "price": 0.55, "quantity": 1}],
          "_total": 0.55
        }
      ];
      replaceSqliteData(database, {orders: data});
    });


    it('should return total amount by days', (done) => {

      const givenStartDate = moment('01/07/2017 00:00:00', 'DD/MM/YYYY HH:mm:ss');
      const givenEndDate = moment('04/07/2017 23:59:59', 'DD/MM/YYYY HH:mm:ss');
      const spyNext = sinon.spy();

      orderStatisticsUseCase.calculateTotalAmountByDays({
        startDate: givenStartDate,
        endDate: givenEndDate
      })
        .subscribe(
          (orderArray) => {
            expect(orderArray).to.have.lengthOf(3);
            expect(orderArray[0].total).to.be.equals(2.2);
            expect(orderArray[1].total).to.be.equals(1.1);
            expect(orderArray[2].total).to.be.equals(1.65);
            spyNext();
          },
          (error) => done(new Error(error)),
          () => {
            expect(spyNext.called).to.be.true;
            done();
          }
        );
    });
  });
});

