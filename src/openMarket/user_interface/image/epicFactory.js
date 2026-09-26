import * as Rx from 'rxjs';

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
    const filters = page.filters || {limit: 20, offset: 0};
    observer.next(actions.listProductsFetch({
      limit: filters.limit,
      offset: filters.offset,
      page: page.current_page || 0
    }));
    return;
  }
  if (pathname === '/list_products_low_stock') {
    const page = state.listProductLowStock || {};
    const filters = page.filters || {limit: 20, offset: 0};
    observer.next(actions.listProductFetch({
      limit: filters.limit,
      offset: filters.offset,
      page: page.current_page || 0
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
  listProductFetch
}) {
  const actions = {categoriesPageLoaded, listProductsFetch, listProductFetch};
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
        summary => {
          running = false;
          observer.next(successNotification({
            title: 'Images ready',
            message: fetchImagesMessage(summary),
            position: 'tr',
            autoDismiss: 4
          }));
          refreshOpenList(observer, store, actions);
        },
        fetchError => {
          running = false;
          observer.next(errorNotification({
            title: 'Could not fetch images',
            message: fetchError && fetchError.message ? fetchError.message : 'Could not fetch images',
            position: 'tr',
            autoDismiss: 4
          }));
        }
      );
    };
    return listen(onFetch);
  });
}
