import openMarket from '../openMarket';
import la from 'lazy-ass';
import is from 'check-more-types';
import Rx from 'rx';
import FixturesService from '../openMarket/product_catalog/infrastructure/service/FixturesService';


const observableFindAllProducts = openMarket.get("products_list_all_use_case");
const observableFindProducts = openMarket.get("products_find_use_case");
const observableCreateProducts = openMarket.get("products_create_use_case");

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

    it('should finish well with limit 10 and offset 0', (done) => {
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


    it("should return 1 product with name Coca-Cola and  limit 10 and offset 0", (done) =>{
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

describe("Product Find by barcode use case", function() {
    beforeEach(function() {
        this.fixturesService = new FixturesService();
        this.fixturesService.load();
    });

    it("should return an Observable of products", function() {
        la(is.fn(observableFindProducts.findProductByBarcode({barcode: "0001"}).subscribe),'has subscribe method')
    });

    it("should return 1 product with barcode 0001", (done) => {
        var count = 0
        const onNumber = () => { count += 1 }
        observableFindProducts.findProductByBarcode({barcode: "0001"}).subscribe(onNumber, noop, () => {
            la(count === 1, 'got '+ count + ' product')
            done()
        })

    });


});

describe("Product Find by ID use case", function() {
    beforeEach(function() {
        this.fixturesService = new FixturesService();
        this.fixturesService.load();
    });

    it("should return an Observable of products", function() {
        la(is.fn(observableFindProducts.findProductById({id: "0"}).subscribe),'has subscribe method')
    });

    it("should return 1 product with Id Seq-0", (done) => {
        var count = 0
        const onNumber = () => { count += 1 }
        observableFindProducts.findProductById({id: "Seq-0"}).subscribe(onNumber, noop, () => {
            la(count === 1, 'got '+ count + ' product')
            done()
        })

    });


});


describe("Product create use case", function() {
    beforeEach(function() {
        this.fixturesService = new FixturesService();
        this.fixturesService.load();
    });
    const productDTO = {
        barcode: "00124",
        name: "Caca de vaca",
        description: "Niiiiiiiiiiiii",
        price: 99,
        stock: 200,
        imageUrl: "http://www.nopuedocreer.com/noticias/wp-content/images/2010/05/vaca.jpg",
        categoryId: 2
    };

    it("should create a new product and then would be 3 products", (done) => {
        var count = 0
        const onNumber = () => { count += 1 }
        observableCreateProducts.create(productDTO).subscribe(data => console.log(data));

        observableFindAllProducts.findAll({limit:10,offset:0}).subscribe(onNumber, noop, () => {
            la(count === 3, 'got '+ count + ' products')
            done()
        });

    });


});

