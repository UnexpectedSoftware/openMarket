import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import ListAllCategories from '../../../../../openMarket/application/service/category/ListAllCategories';
import CategoriesQuery from '../../../../../openMarket/domain/category/CategoriesQuery';

describe('ListAllCategories.list', () => {
  it('forwards the criteria to the repository find', done => {
    const query = new CategoriesQuery({text: 'Dairy', limit: 10, offset: 5});
    let seen;
    const useCase = new ListAllCategories({
      repository: {
        find: value => {
          seen = value;
          return Rx.Observable.of({items: [{id: 'dairy'}], total: 3});
        }
      }
    });
    useCase.list(query).subscribe(
      page => {
        expect(seen).to.equal(query);
        expect(page).to.deep.equal({items: [{id: 'dairy'}], total: 3});
      },
      error => done(error),
      () => done()
    );
  });
});
