import la from 'lazy-ass';
import is from 'check-more-types';
import Rx from 'rxjs/Rx';
import openMarket from '../openMarket';
import FixturesService from '../openMarket/infrastructure/service/FixturesService';
/**
 * Howto
 * https://glebbahmutov.com/blog/testing-reactive-code/
 */

/**
 * @type {CreateOrder}
 */
const observableCreateOrder = openMarket.get('orders_create_use_case');

const noop = () => {};
const crash = (err) => { throw err; };  // rethrow

describe('Order create use case', () => {
  beforeEach(function () {
    this.fixturesService = new FixturesService();
    this.fixturesService.load();
  });

  it('should create a new order and then would be 1 Order on DB', (done) => {
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

