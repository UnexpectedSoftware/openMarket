import la from 'lazy-ass';
import is from 'check-more-types';
import openMarket from '../openMarket/application/index';
import RxLocalStorage from "../openMarket/infrastructure/service/RxLocalStorage";
import {CATEGORIES_KEY, PRODUCTS_KEY} from "../openMarket/infrastructure/service/LocalStorageKeys";


/**
 *
 * @type {ListAllProducts}
 */
const observableFindAllProducts = openMarket.get('products_list_all_use_case');
/**
 *
 * @type {FindProduct}
 */
const observableFindProducts = openMarket.get('products_find_use_case');
/**
 *
 * @type {CreateOrUpdateProduct}
 */
const observableCreateProducts = openMarket.get('products_create_or_update_use_case');

/**
 *
 * @type {AddStock}
 */
const observableAddStockProducts = openMarket.get('products_add_stock_use_case');

const observableProductsStatistics = openMarket.get('products_statistics_use_case');

const noop = () => {};
const crash = (err) => { throw err; };  // rethrow

beforeEach(function () {
  const productsData = [
    {"_id":"Seq-0","_barcode":"0001","_name":"Coca-Cola","_description":"","_price":0.55,"_basePrice":0.3,"_stock":100,"_stockMin":10,"_categoryId":"1","_status":"ENABLED"},
    {"_id":"Seq-1","_barcode":"0002","_name":"Coca-Cola Zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1500,"_stockMin":10,"_categoryId":"2","_status":"ENABLED"},
    {"_id":"Seq-2","_barcode":"0003","_name":"Coca-Cola Zero sin cafeina","_description":"","_price":0.6,"_basePrice":0.3,"_stock":1000,"_stockMin":10,"_categoryId":"2","_status":"ENABLED"},
    {"_id":"Seq-3","_barcode":"0004","_name":"Coca-Cola Zero zero","_description":"","_price":0.6,"_basePrice":0.3,"_stock":9,"_stockMin":10,"_categoryId":"1","_status":"ENABLED"},
    {"_id":"Seq-4","_barcode":"0005","_name":"Coca-Cola Zero 42","_description":"","_price":0.6,"_basePrice":0.3,"_stock":10,"_stockMin":10,"_categoryId":"3","_status":"DISABLED"}
  ];

  const categoryData = [
    {"_id":"1","_name":"Odin"},
    {"_id":"2","_name":"Thor"},
    {"_id":"3","_name":"Heimdall"}
  ];

  RxLocalStorage.saveLocalStorage({localStorageKey: PRODUCTS_KEY, value:productsData})
    .flatMap(saved => RxLocalStorage.saveLocalStorage({localStorageKey: CATEGORIES_KEY, value:categoryData}))
    .subscribe();

});
describe('Product list all use case', () => {

  it('should return an Observable of products', () => {
    la(is.fn(observableFindAllProducts.findAll({ limit: 10, offset: 0 }).subscribe), 'has subscribe method');
  });

  it('should finish well with limit 10 and offset 0', (done) => {
    observableFindAllProducts.findAll({ limit: 10, offset: 0 }).subscribe(noop, noop, done);
  });

  it('should return 1 product with limit 1 and offset 0', (done) => {
    let count = 0;
    const onNumber = () => { count += 1; };
    observableFindAllProducts.findAll({ limit: 1, offset: 0 }).subscribe(onNumber, noop, () => {
      la(count === 1, `got ${count} products`);
      done();
    });
  });


  it('should return 1 product with name Coca-Cola and  limit 10 and offset 0', (done) => {
    let count = 0;
    const onNumber = () => { count += 1; };
    observableFindAllProducts.findAllByName({ name: 'Coca-Cola', limit: 10, offset: 0 }).subscribe(onNumber, noop, () => {
      la(count === 1, `got ${count} products`);
      done();
    });
  });


  it('has no errors', (done) => {
    observableFindAllProducts.findAll({ limit: 10, offset: 0 }).subscribe(noop, crash, done);
  });
});

describe('Product list all with low stock use case', () => {

  it('should return an Observable of products', () => {
    la(is.fn(observableFindAllProducts.findAllWithLowStock({ limit: 10, offset: 0 }).subscribe), 'has subscribe method');
  });

  it('should finish well with limit 10 and offset 0', (done) => {
    observableFindAllProducts.findAllWithLowStock({ limit: 10, offset: 0 }).subscribe(noop, noop, done);
  });

  it('should return 1 product with limit 1 and offset 0', (done) => {
    let count = 0;
    const onNumber = (data) => { count = data.length; };
    observableFindAllProducts.findAllWithLowStock({ limit: 1, offset: 0 }).subscribe(onNumber, noop, () => {
      la(count === 1, `got ${count} products`);
      done();
    });
  });

  it('should return 1 products with low stock', (done) => {
    let count = 0;
    const onNumber = (data) => { count = data.length; };
    observableFindAllProducts.findAllWithLowStock({ limit: 10, offset: 0 }).subscribe(onNumber, noop, () => {
      la(count === 1, `got ${count} products`);
      done();
    });
  });


  it('has no errors', (done) => {
    observableFindAllProducts.findAllWithLowStock({ limit: 10, offset: 0 }).subscribe(noop, crash, done);
  });
});



describe('Product Find by barcode use case', () => {

  it('should return an Observable of products', () => {
    la(is.fn(observableFindProducts.findProductByBarcode({ barcode: '0001' }).subscribe), 'has subscribe method');
  });

  it('should return 1 product with barcode 0001', (done) => {
    let count = 0;
    const onNumber = () => { count += 1; };
    observableFindProducts.findProductByBarcode({ barcode: '0001' }).subscribe(onNumber, noop, () => {
      la(count === 1, `got ${count} product`);
      done();
    });
  });
});


describe('Product create use case', () => {

  const productDTO = {
    barcode: '00124',
    name: 'Caca de vaca',
    description: 'Niiiiiiiiiiiii',
    price: 99,
    stock: 200,
    categoryId:'2'
  };

  it('should create a new product', (done) => {
    let count = 0;
    const onNumber = () => { count += 1; };
    observableCreateProducts.createOrUpdate(productDTO)
      .flatMap(data => observableFindProducts.findProductByBarcode({barcode: productDTO.barcode}))
      .subscribe(onNumber, crash, () => {
        la(count === 1, `got ${count} products`);
        done();
      });
  });

  it('should update an existing product with the new data', (done) => {
    let count = 0;
    const onData = (product) => {
      count += 1;
      if (product.barcode === productDTONew.barcode) {
        la(product.name === productDTONew.name, 'names are not the same');
        la(product.description === productDTONew.description, 'descriptions are not the same');
        la(product.price === productDTONew.price, 'prices are not the same');
        la(product.stock === productDTONew.stock, 'stocks are not the same');
        la(product.category.id === productDTONew.categoryId, 'categoryId are not the same');
        la(product.status === productDTONew.status, `status not updated, product status is ${product.status} and should be ${productDTONew.status}`);
      }
    };
    const productDTONew = {
      id: 'Seq-0',
      barcode: '0001',
      name: 'Updated Name',
      description: 'Updated Description',
      price: 100,
      stock: 100,
      categoryId: '2',
      status: 'DISABLED'

    };
    observableCreateProducts.createOrUpdate(productDTONew)
      .flatMap(data => observableFindProducts.findProductByBarcode({barcode: productDTONew.barcode}))
      .subscribe(onData, noop, () => {
        la(count === 1, `got ${count} products`);
        done();
      });
  });
});

describe('Product add stock use case', () => {

  it('should update an existing product with new stock quantity added', (done) => {
    const onData = (product) => {
      la(product.stock === 1500, 'Stock is not added correctly');
    };

    observableAddStockProducts.addStock({
      barcode: '0002',
      quantity: 500
    })
        .flatMap(data => observableFindProducts.findProductByBarcode({ barcode: '0002' }))
        .subscribe(onData, noop, done());
  });
});

describe('Product statistics use case', () => {

  it('should return the count of all products in data base', (done) => {
    const onData = (total) => {
      la(total === 5, 'Is not counting right!');
    };

    observableProductsStatistics.countProducts().subscribe(onData, noop, done());
  });

  it('should return the count of all products with stock lower than stockMin', (done) => {
    const onData = (total) => {
      la(total === 2, 'Is not counting right!');
    };

    observableProductsStatistics.countProductsWithLowStock().subscribe(onData, noop, done());
  });


});




