import openMarket from '../openMarket';
import la from 'lazy-ass';
import is from 'check-more-types';
import Rx from 'rx';
import FixturesService from '../openMarket/product_catalog/infrastructure/service/FixturesService';


const observableFindAllProducts = openMarket.get("products_list_all_use_case");

const noop = () => {}
const crash = (err) => { throw err }  // rethrow
Rx.config.longStackSupport = true

describe("Product list all use case", function() {

    beforeEach(function() {
        this.fixturesService = new FixturesService();
        this.fixturesService.load();
    });

    it("should return an Observable of products", function() {
        la(is.fn(observableFindAllProducts.findAll({limit:10,offset:0}).subscribe),'has subscribe method')
    });

    it('should finish well', (done) => {
        observableFindAllProducts.findAll({limit:10,offset:0}).subscribe(noop, noop, done)
    })

    it("should return 2 products with limit 10 and offset 0", (done) => {
        var count = 0
        const onNumber = () => { count += 1 }
        observableFindAllProducts.findAll({limit:10,offset:0}).subscribe(onNumber, noop, () => {
            la(count === 2, 'got '+ count + ' products')
            done()
        })

    });

    it("should return 1 product with limit 1 and offset 0", (done) =>{
        var count = 0
        const onNumber = () => { count += 1 }
        observableFindAllProducts.findAll({limit:1,offset:0}).subscribe(onNumber, noop, () => {
            la(count === 1, 'got '+ count + ' products')
            done()
        })
    });


    it("should return 1 product with limit 10 and offset 0", (done) =>{
        var count = 0
        const onNumber = () => { count += 1 }
        observableFindAllProducts.findAllByName({name:"Coca-Cola",limit:10,offset:0}).subscribe(onNumber, noop, () => {
            la(count === 1, 'got '+ count + ' products')
            done()
        })
    });


    it("has no errors", (done) => {
        observableFindAllProducts.findAll({limit:10,offset:0}).subscribe(noop, crash, done)
    })


});
