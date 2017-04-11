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


describe('Category find by id use case', () => {
  beforeEach(function () {
    this.fixturesService = new FixturesService();
    this.fixturesService.load();
  });

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
  beforeEach(function () {
    this.fixturesService = new FixturesService();
    this.fixturesService.load();
  });

  it('should return an Observable of campaigns', () => {
    la(is.fn(observableCategories.findAll().subscribe), 'has subscribe method');
  });

  it('should finish well', (done) => {
    observableCategories.findAll().subscribe(noop, noop, done);
  });

  it('should return 12 campaigns', (done) => {
    let count = 0;
    const onNumber = () => { count += 1; };
    observableCategories
            .findAll()
            .flatMap(arrayData => Rx.Observable.from(arrayData))
            .subscribe(onNumber, noop, () => {
              la(count === 12, `got ${count} campaigns`);
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
  beforeEach(function () {
    this.fixturesService = new FixturesService();
    this.fixturesService.load();
  });

  it('should create a new campaign and then would be 13 campaigns', (done) => {
    let count = 0;
    const onNumber = () => { count += 1; };
    observableCreateCategory.createCategory({
      name: 'category test',
      imageUrl: 'http://www.google.es/caca'
    })
      .flatMap(data => observableCategories.findAll())

      .flatMap(arrayData => Rx.Observable.from(arrayData))
      .subscribe(onNumber, noop, () => {
        la(count === 13, `got ${count} campaigns`);
        done();
      });

  });

  it('has no errors and complete', (done) => {
    observableCreateCategory.createCategory({
      name: 'category test',
      imageUrl: 'http://www.google.es/caca'
    }).subscribe(noop, crash, done);
  });
});

describe('Category update use case', () => {
  beforeEach(function () {
    this.fixturesService = new FixturesService();
    this.fixturesService.load();
  });

  it('should update the first campaign with a new name and image url', (done) => {
    observableCategories.findAll()
            .flatMap(arrayData => Rx.Observable.from(arrayData))
            .first()
            .flatMap(firstCategory => observableUpdateCategory.updateCategory({
              id: firstCategory.id,
              name: 'pepe',
              imageUrl: 'http://42.com'
            }))
            .subscribe(done, crash, noop);
  });

  it('has no errors and complete', (done) => {
    observableCategories.findAll()
            .flatMap(arrayData => Rx.Observable.from(arrayData))
            .first()
            .flatMap(firstCategory => observableUpdateCategory.updateCategory({
              id: firstCategory.id,
              name: 'pepe',
              imageUrl: 'http://42.com'
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
      name: 'pepe',
      imageUrl: 'http://42.com'
    }).subscribe(noop, crash, noop);
  });
});

