import fs from 'fs';
import os from 'os';
import path from 'path';
import la from 'lazy-ass';
import is from 'check-more-types';
import openMarket from '../openMarket/application/index';
import container from '../openMarket/infrastructure/dic/Container';
import ProductEnabledAgain from '../openMarket/domain/event/ProductEnabledAgain';
import { replaceSqliteData } from '../openMarket/infrastructure/service/sqliteSeed';
import { imagesDirectory } from '../openMarket/infrastructure/service/ImageStore';

const database = container.getInstance({key: 'sqliteConnection'}).database;


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
const observableDisableProducts = openMarket.get('products_disable_use_case');
const observableEnableProducts = openMarket.get('products_enable_use_case');

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

  replaceSqliteData(database, {products: productsData, categories: categoryData});

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


  it('lists disabled products after the enabled ones', (done) => {
    observableFindAllProducts.findAll({ limit: 10, offset: 0 }).subscribe((products) => {
      la(products.map(product => product.barcode).join() === '0001,0002,0003,0004,0005',
        `order ${products.map(product => product.barcode).join()}`);
      la(products[4].status === 'DISABLED', `status ${products[4].status}`);
    }, crash, done);
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

  it('finds a disabled product by name and lists it after enabled matches', (done) => {
    observableFindAllProducts.findAllByName({ name: 'Coca-Cola', limit: 10, offset: 0 }).subscribe((products) => {
      la(products.map(product => product.barcode).join() === '0001,0002,0003,0004,0005',
        `order ${products.map(product => product.barcode).join()}`);
      la(products[4].status === 'DISABLED', `status ${products[4].status}`);
    }, crash, done);
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

describe('Product catalog cursor', () => {
  const catalog = (extra) => observableFindAllProducts.findCatalog({
    query: '',
    lowStock: false,
    disabledOnly: false,
    categoryId: null,
    after: null,
    limit: 10,
    ...extra
  });

  const barcodes = (page) => page.products.map(product => product.barcode).join();

  it('lists enabled products before disabled ones and continues after the cursor', (done) => {
    catalog({limit: 2}).subscribe((page) => {
      la(barcodes(page) === '0001,0002', `first ${barcodes(page)}`);
      la(page.hasMore === true, 'first page has more');
      catalog({limit: 2, after: {rank: 0, barcode: '0002'}}).subscribe((next) => {
        la(barcodes(next) === '0003,0004', `second ${barcodes(next)}`);
        la(next.hasMore === true, 'second page has more');
        catalog({limit: 2, after: {rank: 0, barcode: '0004'}}).subscribe((last) => {
          la(barcodes(last) === '0005', `last ${barcodes(last)}`);
          la(last.products[0].status === 'DISABLED', `status ${last.products[0].status}`);
          la(last.hasMore === false, 'last page ends');
        }, crash, done);
      }, crash);
    }, crash);
  });

  it('matches a name or a barcode and treats wildcards as literal text', (done) => {
    catalog({query: 'Zero'}).subscribe((page) => {
      la(barcodes(page) === '0002,0003,0004,0005', `name ${barcodes(page)}`);
      catalog({query: '0004'}).subscribe((byBarcode) => {
        la(barcodes(byBarcode) === '0004', `barcode ${barcodes(byBarcode)}`);
        catalog({query: '%'}).subscribe((percent) => {
          la(percent.products.length === 0, `percent ${percent.products.length}`);
          catalog({query: '_'}).subscribe((underscore) => {
            la(underscore.products.length === 0, `underscore ${underscore.products.length}`);
          }, crash, done);
        }, crash);
      }, crash);
    }, crash);
  });

  it('filters low stock, disabled products, and one category', (done) => {
    catalog({lowStock: true}).subscribe((low) => {
      la(barcodes(low) === '0004,0005', `low ${barcodes(low)}`);
      catalog({disabledOnly: true}).subscribe((disabled) => {
        la(barcodes(disabled) === '0005', `disabled ${barcodes(disabled)}`);
        catalog({lowStock: true, disabledOnly: true}).subscribe((both) => {
          la(barcodes(both) === '0005', `both ${barcodes(both)}`);
          catalog({categoryId: '2', limit: 1}).subscribe((first) => {
            la(barcodes(first) === '0002', `category ${barcodes(first)}`);
            la(first.hasMore === true, 'category has more');
            catalog({categoryId: '2', limit: 1, after: {rank: 0, barcode: '0002'}}).subscribe((second) => {
              la(barcodes(second) === '0003', `category next ${barcodes(second)}`);
              la(second.hasMore === false, 'category ends');
            }, crash, done);
          }, crash);
        }, crash);
      }, crash);
    }, crash);
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

  it('still returns a disabled product by barcode', (done) => {
    observableFindProducts.findProductByBarcode({ barcode: '0005' }).subscribe((product) => {
      la(product.status === 'DISABLED', `status ${product.status}`);
      la(product.barcode === '0005', 'barcode');
    }, crash, done);
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

  it('copies a chosen image and keeps it when the product is updated without a new file', (done) => {
    const source = path.join(os.tmpdir(), `openmarket-product-${process.pid}-${Date.now()}.png`);
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(source, png);
    let stored = null;
    const cleanup = () => {
      fs.rmSync(source, {force: true});
      if (stored) {
        fs.rmSync(stored, {force: true});
      }
    };
    observableCreateProducts.createOrUpdate({
      barcode: '00991',
      name: 'With image',
      description: '',
      price: 1,
      stock: 1,
      categoryId: '1',
      imagePath: source
    })
      .flatMap(() => observableFindProducts.findProductByBarcode({barcode: '00991'}))
      .flatMap((created) => {
        la(created.imageName && created.imageName.endsWith('.png'), `image ${created.imageName}`);
        stored = path.join(imagesDirectory('product-images'), created.imageName);
        la(fs.existsSync(stored), 'copied file');
        return observableCreateProducts.createOrUpdate({
          barcode: '00991',
          name: 'Renamed',
          description: '',
          price: 2,
          stock: 2,
          categoryId: '1'
        });
      })
      .flatMap(() => observableFindProducts.findProductByBarcode({barcode: '00991'}))
      .subscribe((updated) => {
        la(updated.name === 'Renamed', 'name was not updated');
        la(updated.imageName === '00991.png', `image ${updated.imageName}`);
        la(fs.existsSync(stored), 'image file was removed');
      }, (err) => {
        cleanup();
        crash(err);
      }, () => {
        cleanup();
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
      la(total === 5, `counted ${total}`);
    };

    observableProductsStatistics.countProducts().subscribe(onData, crash, done);
  });

  it('should return the count of enabled products with stock lower than stockMin', (done) => {
    const onData = (total) => {
      la(total === 1, `counted ${total}`);
    };

    observableProductsStatistics.countProductsWithLowStock().subscribe(onData, crash, done);
  });

  it('counts every product whose name matches, including disabled ones', (done) => {
    observableProductsStatistics.countProductsByName({name: 'Coca-Cola'}).subscribe((total) => {
      la(total === 5, `counted ${total}`);
    }, crash, done);
  });


});

describe('Disable and enable a product', () => {

  it('keeps a disabled product on the catalog after the enabled ones and drops it from low stock', (done) => {
    observableDisableProducts.disable({barcode: '0001'})
      .flatMap(() => observableFindProducts.findProductByBarcode({barcode: '0001'}))
      .flatMap((product) => {
        la(product.status === 'DISABLED', `status ${product.status}`);
        la(product.stock === 100, `stock ${product.stock}`);
        return observableFindAllProducts.findAll({limit: 10, offset: 0});
      })
      .flatMap((products) => {
        la(products.map(product => product.barcode).join() === '0002,0003,0004,0001,0005',
          `order ${products.map(product => product.barcode).join()}`);
        return observableFindAllProducts.findAllByName({name: 'Coca', limit: 10, offset: 0});
      })
      .flatMap((products) => {
        la(products.map(product => product.barcode).join() === '0002,0003,0004,0001,0005',
          `name order ${products.map(product => product.barcode).join()}`);
        return observableFindAllProducts.findAllWithLowStock({limit: 10, offset: 0});
      })
      .subscribe((products) => {
        la(products.length === 1, `low stock ${products.length}`);
        la(products[0].barcode === '0004', `low stock barcode ${products[0] && products[0].barcode}`);
      }, crash, done);
  });

  it('enables a disabled product, adds one to stock, and publishes one event', (done) => {
    const events = [];
    const subscription = openMarket.get('domain_event_bus')
      .ofType(ProductEnabledAgain)
      .subscribe(event => events.push(event));
    observableEnableProducts.enableForSale({barcode: '0005'})
      .flatMap(() => observableEnableProducts.enableForSale({barcode: '0005'}))
      .flatMap(() => observableFindProducts.findProductByBarcode({barcode: '0005'}))
      .subscribe((product) => {
        la(product.status === 'ENABLED', `status ${product.status}`);
        la(product.stock === 11, `stock ${product.stock}`);
        la(events.length === 1, `events ${events.length}`);
        la(events[0].barcode === '0005', 'event barcode');
        la(events[0].name === 'Coca-Cola Zero 42', 'event name');
      }, (err) => {
        subscription.unsubscribe();
        crash(err);
      }, () => {
        subscription.unsubscribe();
        done();
      });
  });

});




