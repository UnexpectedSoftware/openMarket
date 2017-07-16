import la from 'lazy-ass';
import is from 'check-more-types';
import Rx from 'rxjs/Rx';
import openMarket from '../openMarket';
import FixturesService from '../openMarket/infrastructure/service/FixturesService';
import moment from "moment";
/**
 * Howto
 * https://glebbahmutov.com/blog/testing-reactive-code/
 */

/**
 * @type {CreateOrder}
 */
const observableCreateOrder = openMarket.get('orders_create_use_case');
const observableFindOrders = openMarket.get('orders_list_all_use_case');

const noop = () => {};
const crash = (err) => { throw err; };  // rethrow

describe('Order create use case', () => {
  beforeEach(function () {
    this.fixturesService = new FixturesService();
    this.fixturesService.loadOrders();
  });

  it('should create a new order and then would be 2 Orders on DB', (done) => {
    const lines = [{
      name: "Coca-Cola",
      price: 0.55,
      quantity:1}];
    observableCreateOrder.createOrder({
      lines: lines
    })
      .subscribe(noop, noop, () => {
        done();
      });

  });

  it('has no errors and complete', (done) => {
    const lines = [{
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
    this.fixturesService = new FixturesService();
    this.fixturesService.loadOrders();
  });

  it('should find 1 order between given dates', (done) => {

    const givenStartDate = moment().startOf("month");
    const givenEndDate = moment();
    let count = 0;
    const onNumber = () => { count += 1; };
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

    const givenStartDate = moment().month(moment().month() -2);
    const givenEndDate = moment().month(moment().month() -1);
    console.log("dates:",givenStartDate,givenEndDate);
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
});
