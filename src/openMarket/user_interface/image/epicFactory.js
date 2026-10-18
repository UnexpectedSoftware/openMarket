import * as Rx from 'rxjs';
import {catalogLimit, defaultCatalogSort} from '../product/list_products/model';
import {record, userText} from '../../infrastructure/logging/ErrorLog';
import {toast} from '../components/toast';

export function fetchImagesMessage(summary) {
  const products = summary.productsUpdated;
  const categories = summary.categoriesUpdated;
  const credit = 'Open Food Facts and Wikimedia Commons (CC BY-SA).';
  if (!products && !categories) {
    return 'No new photos found. ' + credit;
  }
  const productLabel = products === 1 ? 'product photo' : 'product photos';
  const categoryLabel = categories === 1 ? 'category photo' : 'category photos';
  return `Added ${products} ${productLabel} and ${categories} ${categoryLabel}. ${credit}`;
}

function pathnameFrom(store) {
  const state = store && store.getState ? store.getState() : {};
  const routing = state.routing || {};
  const location = routing.locationBeforeTransitions || routing.location || {};
  return location.pathname || '';
}

function refreshOpenList(observer, store, actions) {
  const pathname = pathnameFrom(store);
  const state = store && store.getState ? store.getState() : {};
  if (pathname === '/categories') {
    observer.next(actions.categoriesPageLoaded());
    return;
  }
  if (pathname === '/list_products') {
    const page = state.listProducts || {};
    observer.next(actions.listProductsFetch({
      query: page.query || '',
      lowStock: !!page.lowStock,
      status: page.status || null,
      categoryId: page.categoryId || null,
      sort: page.sort || defaultCatalogSort,
      after: null,
      append: false,
      limit: catalogLimit
    }));
  }
}

export function makeFetchImagesEpic({
  fetchCatalogImages,
  listen,
  categoriesPageLoaded,
  listProductsFetch,
  imageFetchProgressed,
  imageFetchFinished
}) {
  const actions = {categoriesPageLoaded, listProductsFetch};
  return (action$, store) => Rx.Observable.create(observer => {
    let running = false;
    const onFetch = () => {
      if (running) {
        observer.next(toast.success(
          'Already fetching images',
          'A fetch is already running'
        ));
        return;
      }
      running = true;
      observer.next(toast.success(
        'Fetching images',
        'Product and category photos will be added in the background'
      ));
      fetchCatalogImages.execute().subscribe(
        value => {
          if (value && value.progress) {
            observer.next(imageFetchProgressed(value.percent));
            return;
          }
          running = false;
          observer.next(imageFetchFinished());
          observer.next(toast.success(
            'Images ready',
            fetchImagesMessage(value)
          ));
          refreshOpenList(observer, store, actions);
        },
        fetchError => {
          record(fetchError);
          running = false;
          observer.next(imageFetchFinished());
          observer.next(toast.error(
            'Could not fetch images',
            userText(fetchError, 'Could not fetch images')
          ));
        }
      );
    };
    return listen(onFetch);
  });
}
