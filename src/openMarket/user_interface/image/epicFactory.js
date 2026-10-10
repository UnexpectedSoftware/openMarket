import * as Rx from 'rxjs';
import {catalogLimit, defaultCatalogSort} from '../product/list_products/model';
import {record, userText} from '../../infrastructure/logging/ErrorLog';

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
  successNotification,
  errorNotification,
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
        observer.next(successNotification({
          title: 'Already fetching images',
          message: 'A fetch is already running',
          position: 'tr',
          autoDismiss: 4
        }));
        return;
      }
      running = true;
      observer.next(successNotification({
        title: 'Fetching images',
        message: 'Product and category photos will be added in the background',
        position: 'tr',
        autoDismiss: 4
      }));
      fetchCatalogImages.execute().subscribe(
        value => {
          if (value && value.progress) {
            observer.next(imageFetchProgressed(value.percent));
            return;
          }
          running = false;
          observer.next(imageFetchFinished());
          observer.next(successNotification({
            title: 'Images ready',
            message: fetchImagesMessage(value),
            position: 'tr',
            autoDismiss: 4
          }));
          refreshOpenList(observer, store, actions);
        },
        fetchError => {
          record(fetchError);
          running = false;
          observer.next(imageFetchFinished());
          observer.next(errorNotification({
            title: 'Could not fetch images',
            message: userText(fetchError, 'Could not fetch images'),
            position: 'tr',
            autoDismiss: 4
          }));
        }
      );
    };
    return listen(onFetch);
  });
}
