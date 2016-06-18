import openMarket from '../openMarket';
import la from 'lazy-ass';
import is from 'check-more-types';
import Rx from 'rx';
import FixturesService from '../openMarket/product_catalog/infrastructure/service/FixturesService';
/**
 * Howto
 * https://glebbahmutov.com/blog/testing-reactive-code/
 */

describe("Test framework", function() {

    this.fixturesService = new FixturesService();
    this.fixturesService.load();

    const observableCategories = openMarket.get("categories_list_all_use_case")
        .findAll()
        .flatMap(arrayData => Rx.Observable.from(arrayData))
        ;
    const noop = () => {}

    it("should return an Observable of campaigns", function() {
        la(is.fn(observableCategories.subscribe),'has subscribe method')
    });

    it('should finish well', (done) => {
        observableCategories.subscribe(noop, noop, done)
    })

    it("should return 12 campaigns", (done) => {
        var count = 0
        const onNumber = () => { count += 1 }
        observableCategories.subscribe(onNumber, noop, () => {
            la(count === 12, 'got '+ count + ' campaigns')
            done()
        })

    });
    it("has no errors", (done) => {
        Rx.config.longStackSupport = true
        const crash = (err) => { throw err }  // rethrow
        observableCategories.subscribe(noop, crash, done)
    })


});