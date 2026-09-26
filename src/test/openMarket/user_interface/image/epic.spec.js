import {expect} from 'chai';
import * as Rx from 'rxjs';
import {makeFetchImagesEpic} from '../../../../openMarket/user_interface/image/epicFactory';

function harness({pathname, execute}) {
  const emitted = [];
  let handler = null;
  let executions = 0;
  const epic = makeFetchImagesEpic({
    fetchCatalogImages: {
      execute: () => {
        executions += 1;
        return execute();
      }
    },
    successNotification: payload => ({type: 'SUCCESS', payload}),
    errorNotification: payload => ({type: 'ERROR', payload}),
    listen(onFetch) {
      handler = onFetch;
      return () => {};
    },
    categoriesPageLoaded: () => ({type: 'CATEGORIES_PAGE_LOADED'}),
    listProductsFetch: payload => ({type: 'LIST_PRODUCTS_FETCH', payload}),
    listProductFetch: payload => ({type: 'LIST_PRODUCT_FETCH', payload})
  });
  const store = {
    getState: () => ({
      routing: {locationBeforeTransitions: {pathname}},
      listProducts: {filters: {limit: 20, offset: 40}, current_page: 2},
      listProductLowStock: {filters: {limit: 20, offset: 0}, current_page: 0}
    })
  };
  epic(Rx.Observable.empty(), store).subscribe(action => emitted.push(action));
  return {
    emitted,
    fetch: () => handler(),
    executions: () => executions
  };
}

describe('Fetch images epic', () => {
  it('shows the start toast before the job finishes', () => {
    let push = null;
    const {emitted, fetch} = harness({
      pathname: '/categories',
      execute: () => Rx.Observable.create(observer => {
        push = observer;
      })
    });
    fetch();
    expect(emitted).to.have.length(1);
    expect(emitted[0].payload).to.include({
      title: 'Fetching images',
      message: 'Product and category photos will be added in the background',
      position: 'tr',
      autoDismiss: 4
    });
    push.next({productsUpdated: 2, categoriesUpdated: 1});
    push.complete();
    expect(emitted[1].payload.title).to.equal('Images ready');
    expect(emitted[1].payload.message).to.include('2 product photos');
    expect(emitted[1].payload.message).to.include('1 category photo');
    expect(emitted[1].payload.message).to.include('CC BY-SA');
    expect(emitted[2]).to.deep.equal({type: 'CATEGORIES_PAGE_LOADED'});
  });

  it('does not start a second job while one is running', () => {
    let push = null;
    const {emitted, fetch, executions} = harness({
      pathname: '/',
      execute: () => Rx.Observable.create(observer => {
        push = observer;
      })
    });
    fetch();
    fetch();
    expect(executions()).to.equal(1);
    expect(emitted[1].payload.title).to.equal('Already fetching images');
    push.next({productsUpdated: 0, categoriesUpdated: 0});
    push.complete();
    expect(emitted[2].payload.message).to.include('No new photos found');
    expect(emitted).to.have.length(3);
  });

  it('refreshes the product list that is open and reports a failed job', () => {
    let push = null;
    const products = harness({
      pathname: '/list_products',
      execute: () => Rx.Observable.create(observer => {
        push = observer;
      })
    });
    products.fetch();
    push.next({productsUpdated: 1, categoriesUpdated: 0});
    push.complete();
    expect(products.emitted[2]).to.deep.equal({
      type: 'LIST_PRODUCTS_FETCH',
      payload: {limit: 20, offset: 40, page: 2}
    });

    const failed = harness({
      pathname: '/list_products_low_stock',
      execute: () => Rx.Observable.throw(new Error('offline'))
    });
    failed.fetch();
    expect(failed.emitted[0].payload.title).to.equal('Fetching images');
    expect(failed.emitted[1]).to.deep.equal({
      type: 'ERROR',
      payload: {
        title: 'Could not fetch images',
        message: 'offline',
        position: 'tr',
        autoDismiss: 4
      }
    });
  });
});
