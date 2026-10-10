import fs from 'fs';
import os from 'os';
import path from 'path';
import la from 'lazy-ass';
import is from 'check-more-types';
import Rx from 'rxjs/Rx';
import openMarket from '../openMarket/application/index';
import container from '../openMarket/infrastructure/dic/Container';
import { replaceSqliteData } from '../openMarket/infrastructure/service/sqliteSeed';
import { imagesDirectory } from '../openMarket/infrastructure/service/ImageStore';

const database = container.getInstance({key: 'sqliteConnection'}).database;
/**
 * Howto
 * https://glebbahmutov.com/blog/testing-reactive-code/
 */

/**
 * @type {Observable.<Array.<Category>>}
 */
const observableCategories = openMarket.get('categories_list_all_use_case');
/**
 * @type {CreateCategory}
 */
const observableCreateCategory = openMarket.get('categories_create_use_case');
/**
 * @type {UpdateCategory}
 */
const observableUpdateCategory = openMarket.get('categories_update_use_case');
/**
 *
 * @type {FindCategoryById}
 */
const observableFindByIdCategory = openMarket.get('categories_find_by_id_use_case');
const observableDeleteCategory = openMarket.get('categories_delete_use_case');


const noop = () => {};
const crash = (err) => { throw err; };  // rethrow

beforeEach(function () {
  const data =[
      {"_id":"1","_name":"Odin"},
      {"_id":"2","_name":"Thor"},
      {"_id":"3","_name":"Heimdall"}
    ];
  replaceSqliteData(database, {categories: data});
});

describe('Category find by id use case', () => {

  it('should return an Observable with no elements', (done) => {
    let count = 0;
    const onNumber = () => { count += 1; };
    observableFindByIdCategory
            .findById({
              id: 'non-existent'
            })
            .subscribe(onNumber, noop, () => {
              la(count === 0, `got ${count} campaigns`);
              done();
            });
  });
  it('has no errors and complete', (done) => {
    observableFindByIdCategory
            .findById({
              id: 'non-existent'
            })
            .subscribe(noop, crash, done);
  });
});


describe('Category list all use case', () => {

  it('should return an Observable of categories', () => {
    la(is.fn(observableCategories.findAllWithStats().subscribe), 'has subscribe method');
  });

  it('should finish well', (done) => {
    observableCategories.findAllWithStats().subscribe(noop, noop, done);
  });

  it('should return 3 categories', (done) => {
    let count = 0;
    const onNumber = (data) => { count = data.length; };
    observableCategories
            .findAllWithStats()
            .subscribe(onNumber, noop, () => {
              la(count === 3, `got ${count} categories`);
              done();
            });
  });

  it('has no errors and complete', (done) => {
    observableCategories
            .findAllWithStats()
            .flatMap(arrayData => Rx.Observable.from(arrayData))
            .subscribe(noop, crash, done);
  });
});

describe('Category create use case', () => {

  it('should create a new category and then would be 4 categories', (done) => {
    let count = 0;
    const onNumber = () => { count += 1; };
    observableCreateCategory.createCategory({
      name: 'Loki'
    })
      .flatMap(data => observableCategories.findAllWithStats())
      .flatMap(arrayData => Rx.Observable.from(arrayData))
      .subscribe(onNumber, noop, () => {
        la(count === 4, `got ${count} categories`);
        done();
      });

  });

  it('has no errors and complete', (done) => {
    observableCreateCategory.createCategory({
      name: 'category test'
    }).subscribe(noop, crash, done);
  });

  it('copies a chosen image and lists the filename', (done) => {
    const source = path.join(os.tmpdir(), `openmarket-category-${process.pid}-${Date.now()}.png`);
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
    observableCreateCategory.createCategory({
      name: 'With image',
      imagePath: source
    })
      .flatMap(() => observableCategories.findAllWithStats())
      .subscribe((categories) => {
        const created = categories.filter(category => category.name === 'With image')[0];
        la(created, 'created category');
        la(created.imageName && created.imageName.endsWith('.png'), `image ${created.imageName}`);
        stored = path.join(imagesDirectory('category-images'), created.imageName);
        la(fs.existsSync(stored), 'copied file');
        const seeded = categories.filter(category => category.name === 'Odin')[0];
        la(seeded.imageName == null, 'seeded category has no image');
      }, (err) => {
        cleanup();
        crash(err);
      }, () => {
        cleanup();
        done();
      });
  });

  it('does not insert a category when the image is not allowed', (done) => {
    const source = path.join(os.tmpdir(), `openmarket-category-${process.pid}-${Date.now()}.txt`);
    fs.writeFileSync(source, 'hello');
    observableCreateCategory.createCategory({
      name: 'Not an image',
      imagePath: source
    }).subscribe(() => {
      fs.rmSync(source, {force: true});
      done(new Error('expected the image to be rejected'));
    }, () => {
      fs.rmSync(source, {force: true});
      observableCategories.findAllWithStats().subscribe((categories) => {
        la(categories.length === 3, `got ${categories.length} categories`);
        la(!categories.some(category => category.name === 'Not an image'), 'row was inserted');
        done();
      }, crash);
    });
  });
});

describe('Category update use case', () => {

  it('should update the first campaign with a new name', (done) => {
    observableCategories.findAllWithStats()
            .flatMap(arrayData => Rx.Observable.from(arrayData))
            .first()
            .flatMap(firstCategory => observableUpdateCategory.updateCategory({
              id: firstCategory.id,
              name: 'pepe'
            }))
            .subscribe(done, crash, noop);
  });

  it('has no errors and complete', (done) => {
    observableCategories.findAllWithStats()
            .flatMap(arrayData => Rx.Observable.from(arrayData))
            .first()
            .flatMap(firstCategory => observableUpdateCategory.updateCategory({
              id: firstCategory.id,
              name: 'pepe'
            }))
            .subscribe(noop, crash, done);
  });


  it('should try to update a non existent campaign and return error', (done) => {
    const crash = (err) => {
      la(is.error(err), 'has error');
      done();
    };
    observableUpdateCategory.updateCategory({
      id: 'non-existent',
      name: 'pepe'
    }).subscribe(noop, crash, noop);
  });

  it('removes a stored image and keeps the name', (done) => {
    const source = path.join(os.tmpdir(), `openmarket-category-${process.pid}-${Date.now()}-clear.png`);
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
    observableCreateCategory.createCategory({
      name: 'Clear me',
      imagePath: source
    })
      .flatMap(() => observableCategories.findAllWithStats())
      .flatMap((categories) => {
        const created = categories.filter(category => category.name === 'Clear me')[0];
        la(created && created.imageName, 'created with an image');
        stored = path.join(imagesDirectory('category-images'), created.imageName);
        return observableUpdateCategory.removeImage({id: created.id}).map(() => created.id);
      })
      .flatMap(id => observableFindByIdCategory.findById({id}))
      .subscribe((category) => {
        la(category.name === 'Clear me', 'name kept');
        la(category.imageName == null, `image ${category.imageName}`);
        la(stored && !fs.existsSync(stored), 'file removed');
      }, (err) => {
        cleanup();
        crash(err);
      }, () => {
        cleanup();
        done();
      });
  });
});

function resetProducts() {
  database.exec('DELETE FROM product_sale_day');
  database.exec('DELETE FROM product');
}

function insertProduct({barcode, name, basePrice, stock, status, categoryId}) {
  database.prepare(
    'INSERT INTO product (barcode, name, base_price, stock, status, category_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(barcode, name, basePrice, stock, status, categoryId);
}

function insertSale({barcode, name, quantity, amount}) {
  database.prepare(
    'INSERT INTO product_sale_day (barcode, name, sold_on, quantity, amount) VALUES (?, ?, ?, ?, ?)'
  ).run(barcode, name, '2026-01-01', quantity, amount);
}

function byName(categories, name) {
  return categories.filter(category => category.name === name)[0];
}

describe('Category summaries', () => {

  it('sums products and ranks the most sold name', (done) => {
    resetProducts();
    insertProduct({barcode: '1001', name: 'Apple', basePrice: 1.5, stock: 2, status: 'ENABLED', categoryId: '1'});
    insertProduct({barcode: '1002', name: 'Pear', basePrice: 2.5, stock: 0.5, status: 'DISABLED', categoryId: '1'});
    insertProduct({barcode: '1003', name: 'Blank', basePrice: null, stock: null, status: 'ENABLED', categoryId: '1'});
    insertProduct({barcode: '2001', name: 'Milk', basePrice: 1, stock: 10, status: 'ENABLED', categoryId: '2'});
    insertProduct({barcode: '2002', name: 'Cheese', basePrice: 1, stock: 1, status: 'ENABLED', categoryId: '2'});
    insertSale({barcode: '1001', name: 'Apple', quantity: 3, amount: 100});
    insertSale({barcode: '1002', name: 'Pear', quantity: 4, amount: 1});
    insertSale({barcode: '2001', name: 'Milk', quantity: 5, amount: 12});
    insertSale({barcode: '2002', name: 'Cheese', quantity: 5, amount: 12});
    insertSale({barcode: '9999', name: 'Gone', quantity: 99, amount: 99});

    observableCategories.findAllWithStats().subscribe((categories) => {
      const odin = byName(categories, 'Odin');
      la(odin.productCount === 3, `odin products ${odin.productCount}`);
      la(odin.stockTotal === 2.5, `odin stock ${odin.stockTotal}`);
      la(odin.basePriceTotal === 4, `odin value ${odin.basePriceTotal}`);
      la(odin.mostSold.name === 'Pear', `odin most sold ${odin.mostSold && odin.mostSold.name}`);
      la(odin.mostSold.barcode === '1002', `odin barcode ${odin.mostSold && odin.mostSold.barcode}`);
      la(odin.mostSold.quantity === 4, `odin quantity ${odin.mostSold && odin.mostSold.quantity}`);
      la(odin.imageName == null, 'image name still present');

      const thor = byName(categories, 'Thor');
      la(thor.productCount === 2, `thor products ${thor.productCount}`);
      la(thor.stockTotal === 11, `thor stock ${thor.stockTotal}`);
      la(thor.basePriceTotal === 2, `thor value ${thor.basePriceTotal}`);
      la(thor.mostSold.name === 'Cheese', `thor most sold ${thor.mostSold && thor.mostSold.name}`);
      la(thor.mostSold.barcode === '2002', `thor barcode ${thor.mostSold && thor.mostSold.barcode}`);
      la(thor.mostSold.quantity === 5, `thor quantity ${thor.mostSold.quantity}`);

      const heimdall = byName(categories, 'Heimdall');
      la(heimdall.productCount === 0, `heimdall products ${heimdall.productCount}`);
      la(heimdall.stockTotal === 0, `heimdall stock ${heimdall.stockTotal}`);
      la(heimdall.basePriceTotal === 0, `heimdall value ${heimdall.basePriceTotal}`);
      la(heimdall.mostSold == null, 'heimdall has no most sold');
      done();
    }, crash);
  });
});

describe('Category delete use case', () => {

  it('removes an empty category and its image', (done) => {
    const source = path.join(os.tmpdir(), `openmarket-category-${process.pid}-${Date.now()}-delete.png`);
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
    observableCreateCategory.createCategory({
      name: 'Delete me',
      imagePath: source
    })
      .flatMap(() => observableCategories.findAllWithStats())
      .flatMap((categories) => {
        const created = byName(categories, 'Delete me');
        la(created && created.imageName, 'created with an image');
        la(created.productCount === 0, 'empty category');
        stored = path.join(imagesDirectory('category-images'), created.imageName);
        return observableDeleteCategory.deleteCategory({id: created.id});
      })
      .flatMap(() => observableCategories.findAllWithStats())
      .subscribe((categories) => {
        la(!categories.some(category => category.name === 'Delete me'), 'row remains');
        la(categories.length === 3, `got ${categories.length} categories`);
        la(stored && !fs.existsSync(stored), 'file removed');
      }, (err) => {
        cleanup();
        crash(err);
      }, () => {
        cleanup();
        done();
      });
  });

  it('refuses to delete a category that still has a product', (done) => {
    resetProducts();
    insertProduct({barcode: '1001', name: 'Apple', basePrice: 1, stock: 1, status: 'DISABLED', categoryId: '1'});
    observableDeleteCategory.deleteCategory({id: '1'}).subscribe(() => {
      done(new Error('expected the category to be kept'));
    }, (err) => {
      la(err.code === 'CATEGORY_NOT_EMPTY' && err.userMessage === 'Category still has products', err.message);
      observableCategories.findAllWithStats().subscribe((categories) => {
        const odin = byName(categories, 'Odin');
        la(odin && odin.productCount === 1, 'category remains');
        done();
      }, crash);
    });
  });

  it('returns an error when the category does not exist', (done) => {
    observableDeleteCategory.deleteCategory({id: 'missing'}).subscribe(() => {
      done(new Error('expected a missing category to fail'));
    }, (err) => {
      la(err.code === 'CATEGORY_NOT_FOUND' && err.userMessage === 'category not found', err.message);
      done();
    });
  });
});

