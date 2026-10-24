import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toArray';
import ProductsQuery from '../../../../../openMarket/domain/product/ProductsQuery';
import {
  PRODUCTS_FAILED,
  PRODUCTS_FILTERS_CHANGED,
  PRODUCTS_LOADED,
  PRODUCTS_PAGE_OPENED,
  PRODUCTS_QUERY_CHANGED
} from '../../../../../openMarket/user_interface/product/list_products/action';
import {makeCategoriesEpic, makeProductsListEpic} from '../../../../../openMarket/user_interface/product/list_products/epicFactory';
import {filtersChanged, state} from '../../../../../openMarket/user_interface/product/list_products/model';

function row(name) {
  return {
    barcode: name,
    name,
    categoryId: null,
    categoryName: null,
    priceCents: 200,
    basePriceCents: 100,
    marginPercent: 50,
    vat: null,
    stock: 1,
    stockMin: 1,
    weighted: false,
    status: 'ENABLED',
    lowStock: false,
    imageUrl: null
  };
}

describe('makeProductsListEpic', () => {
  it('reads the page with a ProductsQuery', done => {
    const page = {
      ...state(),
      query: 'milk',
      status: 'ENABLED',
      categoryId: 'dairy',
      weighted: true,
      lowStock: false,
      sort: 'stock_asc',
      offset: 20,
      limit: 20
    };
    let criteria = null;
    const listProducts = {
      list: query => {
        criteria = query;
        return Rx.Observable.of({items: [row('Milk')], total: 21});
      }
    };
    const store = {getState: () => ({listProducts: page})};
    makeProductsListEpic(listProducts)(Rx.Observable.of({type: PRODUCTS_FILTERS_CHANGED}), store)
      .toArray()
      .subscribe(
        actions => {
          expect(criteria).to.be.instanceof(ProductsQuery);
          expect(criteria.text).to.equal('milk');
          expect(criteria.status).to.equal('ENABLED');
          expect(criteria.categoryId).to.equal('dairy');
          expect(criteria.weighted).to.equal(true);
          expect(criteria.lowStock).to.equal(false);
          expect(criteria.sort).to.equal('stock_asc');
          expect(criteria.limit).to.equal(20);
          expect(criteria.offset).to.equal(20);
          expect(criteria.forSale).to.equal(false);
          expect(actions.map(action => action.type)).to.deep.equal([PRODUCTS_LOADED]);
          expect(actions[0].payload.items[0].name).to.equal('Milk');
          expect(actions[0].payload.total).to.equal(21);
          expect(actions[0].payload.offset).to.equal(20);
        },
        error => done(error),
        () => done()
      );
  });

  it('drops a slower filter when a newer one arrives', () => {
    const first = new Rx.Subject();
    let calls = 0;
    const seen = [];
    let page = filtersChanged(state(), {status: 'ENABLED', sort: 'name_asc'});
    const listProducts = {
      list: query => {
        calls += 1;
        seen.push(query);
        if (calls === 1) {
          return first;
        }
        return Rx.Observable.of({items: [row('Second')], total: 1});
      }
    };
    const actions = new Rx.Subject();
    const received = [];
    const subscription = makeProductsListEpic(listProducts)(actions, {
      getState: () => ({listProducts: page})
    }).subscribe(action => received.push(action));
    actions.next({type: PRODUCTS_FILTERS_CHANGED});
    page = filtersChanged(page, {status: 'DISABLED', sort: 'name_asc'});
    actions.next({type: PRODUCTS_FILTERS_CHANGED});
    expect(received.map(action => action.type)).to.deep.equal([PRODUCTS_LOADED]);
    expect(received[0].payload.items[0].name).to.equal('Second');
    expect(seen[0].status).to.equal('ENABLED');
    expect(seen[1]).to.be.instanceof(ProductsQuery);
    expect(seen[1].status).to.equal('DISABLED');
    first.next({items: [row('First')], total: 1});
    first.complete();
    expect(received).to.have.length(1);
    subscription.unsubscribe();
  });

  it('reports a failure as PRODUCTS_FAILED', done => {
    const listProducts = {list: () => Rx.Observable.throw(new Error('db down'))};
    makeProductsListEpic(listProducts)(
      Rx.Observable.of({type: PRODUCTS_FILTERS_CHANGED}),
      {getState: () => ({listProducts: state()})}
    ).toArray().subscribe(
      actions => {
        expect(actions.map(action => action.type)).to.deep.equal([PRODUCTS_FAILED]);
        expect(actions[0].payload.message).to.equal('db down');
        expect(actions[0].payload.query).to.equal('');
      },
      error => done(error),
      () => done()
    );
  });

  it('waits 300 ms before searching', done => {
    let calls = 0;
    const listProducts = {
      list: () => {
        calls += 1;
        return Rx.Observable.of({items: [], total: 0});
      }
    };
    const actions = new Rx.Subject();
    const page = {...state(), query: 'leche'};
    const subscription = makeProductsListEpic(listProducts)(actions, {
      getState: () => ({listProducts: page})
    }).subscribe();
    actions.next({type: PRODUCTS_QUERY_CHANGED, payload: 'leche'});
    expect(calls).to.equal(0);
    setTimeout(() => {
      try {
        expect(calls).to.equal(1);
        subscription.unsubscribe();
        done();
      } catch (error) {
        done(error);
      }
    }, 400);
  });
});

describe('makeCategoriesEpic', () => {
  it('loads category names when the page opens', done => {
    const listCategories = {
      findAllWithStats: () => Rx.Observable.of([
        {id: '2', name: 'Panadería'},
        {id: '1', name: 'Fruta'}
      ])
    };
    makeCategoriesEpic(listCategories)(Rx.Observable.of({type: PRODUCTS_PAGE_OPENED}))
      .toArray()
      .subscribe(
        actions => {
          expect(actions[0].payload.map(category => category.name)).to.deep.equal(['Fruta', 'Panadería']);
        },
        error => done(error),
        () => done()
      );
  });
});
