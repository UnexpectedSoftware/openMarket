import la from 'lazy-ass';
import openMarket from '../openMarket';
import moment from "moment";
import { expect } from 'chai';
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
/**
 *
 * @type {FindProduct}
 */
const observableFindProducts = openMarket.get('products_find_use_case');

const noop = () => {};
const crash = (err) => { throw err; };  // rethrow

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
    observableCreateOrder.createOrder({
      lines: lines
    })
      .flatMap(saved => observableFindProducts.findProductByBarcode({ barcode: '0001' }))
      .subscribe((product) => {
        expect(product.stock).to.equal(95);
        done();
      },crash, noop);
  });

  it('has no errors and complete', (done) => {
    const lines = [{
      barcode: "0001",
      name: "Coca-Cola",
      price: 0.55,
      quantity:1}];
    observableCreateOrder.createOrder({
      lines: lines
    }).subscribe(noop, crash, done);
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
    let count = 0;
    const onNumber = (data) => { count = data.length; };
    observableFindOrders.findAllByDates({
      startDate: givenStartDate,
      endDate: givenEndDate,
      limit: 10,
      offset: 0
    })
      .subscribe(onNumber, noop, () => {
        la(count === 1, `got ${count} orders`);
        done();
      });

  });
  it('shouldn\'t find any order between given dates', (done) => {

    const givenStartDate = moment('01/06/2017 17:53:04','DD/MM/YYYY HH:mm:ss');
    const givenEndDate = moment('02/06/2017 17:53:04','DD/MM/YYYY HH:mm:ss');
    let count = 0;
    const onNumber = (data) => { count = data.length; };
    observableFindOrders.findAllByDates({
      startDate: givenStartDate,
      endDate: givenEndDate,
      limit: 10,
      offset: 0
    })
      .subscribe(onNumber, noop, () => {
        la(count === 0, `got ${count} orders`);
        done();
      });

  });

  it('should find one order with given limit and offset', (done) => {

    const givenStartDate = moment('01/07/2017 17:53:04','DD/MM/YYYY HH:mm:ss');
    const givenEndDate = moment('31/07/2017 17:53:04','DD/MM/YYYY HH:mm:ss');
    let count = 0;
    const onNumber = (data) => { count = data.length; };
    observableFindOrders.findAllByDates({
      startDate: givenStartDate,
      endDate: givenEndDate,
      limit: 1,
      offset: 1
    })
      .subscribe(onNumber, noop, () => {
        la(count === 1, `got ${count} orders`);
        done();
      });

  });


});
