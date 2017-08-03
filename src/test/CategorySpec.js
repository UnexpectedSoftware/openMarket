import la from 'lazy-ass';
import is from 'check-more-types';
import Rx from 'rxjs/Rx';
import openMarket from '../openMarket';
import RxLocalStorage from "../openMarket/infrastructure/service/RxLocalStorage";
import {CATEGORIES_KEY} from "../openMarket/infrastructure/service/LocalStorageKeys";
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
  const data = [
    {"id":"3d8dbdcb-fe7a-4e26-baa4-d74f612fe8d4","name":"Fruta","imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","products":[]},
    {"id":"529971af-4d59-48c9-9f64-24ede146f38d","name":"Conservas","imageUrl":"http://estaticos.mujeresreales.es/rcs/articles/2221/imagenes//CP_02-04-03_S491_opt.jpg","products":[]},
    {"id":"5203cb7b-7056-4242-951c-51836e3b42cb","name":"Vinos","imageUrl":"http://www.escuelaespanolalicante.com/wp-content/uploads/2016/02/copasvinos.jpg","products":[]},
    {"id":"3eda3af9-94b6-4d6c-8837-150ea26ec32a","name":"Fruta","imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","products":[]},
    {"id":"61c2c5f6-0f8e-4232-b3ee-4ed67c034af5","name":"Conservas","imageUrl":"http://estaticos.mujeresreales.es/rcs/articles/2221/imagenes//CP_02-04-03_S491_opt.jpg","products":[]},
    {"id":"6ebf9e32-3f0a-4c39-8937-16e19b321ecd","name":"Vinos","imageUrl":"http://www.escuelaespanolalicante.com/wp-content/uploads/2016/02/copasvinos.jpg","products":[]},
    {"id":"b0c71902-d327-4e49-8b31-af2e8c40de5c","name":"Fruta","imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","products":[]},
    {"id":"9e336af4-12fc-4f3a-bad1-656f60222cc0","name":"Conservas","imageUrl":"http://estaticos.mujeresreales.es/rcs/articles/2221/imagenes//CP_02-04-03_S491_opt.jpg","products":[]},
    {"id":"2313b64c-d1f0-43bf-9699-ffa4f4c835a0","name":"Vinos","imageUrl":"http://www.escuelaespanolalicante.com/wp-content/uploads/2016/02/copasvinos.jpg","products":[]},
    {"id":"138b3699-a8ae-4106-9cad-8bbc23450359","name":"Fruta","imageUrl":"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg","products":[]},
    {"id":"d548cbcd-2d9a-412d-a4c1-80af6cd8dc1a","name":"Conservas","imageUrl":"http://estaticos.mujeresreales.es/rcs/articles/2221/imagenes//CP_02-04-03_S491_opt.jpg","products":[]},
    {"id":"c6c3ece3-79c0-4d2c-9256-89571906a0e8","name":"Vinos","imageUrl":"http://www.escuelaespanolalicante.com/wp-content/uploads/2016/02/copasvinos.jpg","products":[]}
  ];
  RxLocalStorage.saveLocalStorage({localStorageKey: CATEGORIES_KEY, value:data})
    .subscribe();
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

  it('should return 12 categories', (done) => {
    let count = 0;
    const onNumber = () => { count += 1; };
    observableCategories
            .findAll()
            .flatMap(arrayData => Rx.Observable.from(arrayData))
            .subscribe(onNumber, noop, () => {
              la(count === 12, `got ${count} categories`);
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

  it('should create a new category and then would be 13 categories', (done) => {
    let count = 0;
    const onNumber = () => { count += 1; };
    observableCreateCategory.createCategory({
      name: 'category test',
      imageUrl: 'http://www.google.es/caca'
    })
      .flatMap(data => observableCategories.findAll())
      .flatMap(arrayData => Rx.Observable.from(arrayData))
      .subscribe(onNumber, noop, () => {
        la(count === 13, `got ${count} categories`);
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

