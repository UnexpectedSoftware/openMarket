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
    la(is.fn(observableCategories.findAll().subscribe), 'has subscribe method');
  });

  it('should finish well', (done) => {
    observableCategories.findAll().subscribe(noop, noop, done);
  });

  it('should return 3 categories', (done) => {
    let count = 0;
    const onNumber = (data) => { count = data.length; };
    observableCategories
            .findAll()
            .subscribe(onNumber, noop, () => {
              la(count === 3, `got ${count} categories`);
              done();
            });
  });

  it('has no errors and complete', (done) => {
    observableCategories
            .findAll()
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
      .flatMap(data => observableCategories.findAll())
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
      .flatMap(() => observableCategories.findAll())
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
      observableCategories.findAll().subscribe((categories) => {
        la(categories.length === 3, `got ${categories.length} categories`);
        la(!categories.some(category => category.name === 'Not an image'), 'row was inserted');
        done();
      }, crash);
    });
  });
});

describe('Category update use case', () => {

  it('should update the first campaign with a new name', (done) => {
    observableCategories.findAll()
            .flatMap(arrayData => Rx.Observable.from(arrayData))
            .first()
            .flatMap(firstCategory => observableUpdateCategory.updateCategory({
              id: firstCategory.id,
              name: 'pepe'
            }))
            .subscribe(done, crash, noop);
  });

  it('has no errors and complete', (done) => {
    observableCategories.findAll()
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
});

