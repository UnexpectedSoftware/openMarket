import la from 'lazy-ass';
import openMarket from '../openMarket/application/index';
import moment from "moment";
import { expect } from 'chai';
import sinon from 'sinon';
import RxLocalStorage from "../openMarket/infrastructure/service/RxLocalStorage";
import {ORDERS_KEY, PRODUCTS_KEY} from "../openMarket/infrastructure/service/LocalStorageKeys";

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

afterEach(function () {
  RxLocalStorage.saveLocalStorage({
    localStorageKey: ORDERS_KEY,
    value: []
  }).flatMap(saved => RxLocalStorage.saveLocalStorage({
    localStorageKey: PRODUCTS_KEY,
    value: []
  })
  ).subscribe();


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

    RxLocalStorage.saveLocalStorage({
      localStorageKey: ORDERS_KEY,
      value: orderData
    }).flatMap(saved =>
      RxLocalStorage.saveLocalStorage({
        localStorageKey: PRODUCTS_KEY,
        value: productData
      })
    ).subscribe();
  });

  it('should create a new order and then would be 2 Orders on DB', (done) => {
    const lines = [{
      barcode: "0001",
      name: "Coca-Cola",
      price: 0.55,
      quantity:5}];
    const spyNext = sinon.spy();

    observableCreateOrder.createOrder({
      lines: lines
    })
      .flatMap(saved => observableFindProducts.findProductByBarcode({ barcode: '0001' }))
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

describe('Order find use case by dates', () => {

  beforeEach(function () {
    const data = [
      {"_id":"01","_createdAt":"01/07/2017 17:53:04","_lines":[{"barcode":"0001","name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"01","_createdAt":"02/07/2017 17:53:04","_lines":[{"barcode":"0002","name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55},
      {"_id":"01","_createdAt":"03/07/2017 17:53:04","_lines":[{"barcode":"0003","name":"Coca-Cola","price":0.55,"quantity":1}],"_total":0.55}
    ];
    RxLocalStorage.saveLocalStorage({
      localStorageKey: ORDERS_KEY,
      value: data
    }).subscribe();
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
      RxLocalStorage.saveLocalStorage({
        localStorageKey: ORDERS_KEY,
        value: data
      }).subscribe();
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

