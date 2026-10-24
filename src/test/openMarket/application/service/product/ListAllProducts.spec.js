import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import ListAllProducts from '../../../../../openMarket/application/service/product/ListAllProducts';
import ProductDetailQuery from '../../../../../openMarket/domain/product/ProductDetailQuery';
import ProductsQuery from '../../../../../openMarket/domain/product/ProductsQuery';

describe('ListAllProducts.list', () => {
  it('forwards the criteria to the repository find', done => {
    const query = new ProductsQuery({text: 'milk', forSale: true, limit: 24});
    let seen;
    const useCase = new ListAllProducts({
      repository: {
        find: value => {
          seen = value;
          return Rx.Observable.of({items: [], total: 0});
        }
      },
      productFilterFactory: {}
    });
    useCase.list(query).subscribe(
      page => {
        expect(seen).to.equal(query);
        expect(page).to.deep.equal({items: [], total: 0});
      },
      error => done(error),
      () => done()
    );
  });

  it('forwards findDetail and stays empty when the repository does', done => {
    const query = new ProductDetailQuery({barcode: '0001'});
    let seen;
    const useCase = new ListAllProducts({
      repository: {
        findDetail: value => {
          seen = value;
          return Rx.Observable.empty();
        }
      },
      productFilterFactory: {}
    });
    let emitted = false;
    useCase.detail(query).subscribe(
      () => { emitted = true; },
      error => done(error),
      () => {
        expect(seen).to.equal(query);
        expect(emitted).to.equal(false);
        done();
      }
    );
  });
});
