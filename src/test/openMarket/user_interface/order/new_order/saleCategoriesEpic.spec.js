import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/toArray';
import CategoryView from '../../../../../openMarket/domain/category/CategoryView';
import CategoriesQuery from '../../../../../openMarket/domain/category/CategoriesQuery';
import {
  SALE_CATEGORIES_FAILED,
  SALE_CATEGORIES_LOADED,
  SALE_CATEGORIES_REQUESTED
} from '../../../../../openMarket/user_interface/order/new_order/action';
import {makeSaleCategoriesEpic} from '../../../../../openMarket/user_interface/order/new_order/epicFactory';

describe('makeSaleCategoriesEpic', () => {
  it('reads id and name for the chips', done => {
    let criteria;
    const listCategories = {
      list: query => {
        criteria = query;
        return Rx.Observable.of({
          items: [
            new CategoryView({id: 'dairy', name: 'Lácteos'}),
            {id: '', name: 'Missing'},
            {id: 'blank', name: ''}
          ],
          total: 3
        });
      }
    };
    makeSaleCategoriesEpic(listCategories)(Rx.Observable.of({type: SALE_CATEGORIES_REQUESTED}))
      .toArray()
      .subscribe(
        actions => {
          expect(criteria).to.be.instanceof(CategoriesQuery);
          expect(criteria.sort).to.equal('name_asc');
          expect(actions).to.deep.equal([{
            type: SALE_CATEGORIES_LOADED,
            payload: [{id: 'dairy', name: 'Lácteos'}]
          }]);
        },
        error => done(error),
        () => done()
      );
  });

  it('reports a failure', done => {
    const listCategories = {list: () => Rx.Observable.throw(new Error('db down'))};
    makeSaleCategoriesEpic(listCategories)(Rx.Observable.of({type: SALE_CATEGORIES_REQUESTED}))
      .toArray()
      .subscribe(
        actions => {
          expect(actions).to.deep.equal([{type: SALE_CATEGORIES_FAILED}]);
        },
        error => done(error),
        () => done()
      );
  });
});
