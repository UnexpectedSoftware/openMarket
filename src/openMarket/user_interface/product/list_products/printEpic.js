import * as Rx from 'rxjs';
import {LIST_PRODUCTS_PRINT} from './action';

function toast(title, message) {
  return {
    title,
    message,
    position: 'tr',
    autoDismiss: 4
  };
}

function filtersFrom(store) {
  const state = store && store.getState ? store.getState() : {};
  const page = state.listProducts || {};
  const categories = page.categories || [];
  const category = categories.find(item => item.id === page.categoryId);
  return {
    query: page.query || '',
    lowStock: !!page.lowStock,
    status: page.status || null,
    categoryId: page.categoryId || null,
    categoryName: category ? category.name : '',
    printedAt: new Date().toLocaleString('es-ES')
  };
}

function failureMessage(printError) {
  const detail = printError && printError.message ? printError.message : 'Could not print products';
  if (printError && printError.printed > 0) {
    return `Printed ${printError.printed} of ${printError.total}. ${detail}`;
  }
  return detail;
}

export function makePrintCatalogEpic({
  printProductCatalog,
  successNotification,
  errorNotification,
  catalogPrintProgressed,
  catalogPrintFinished
}) {
  return (action$, store) => Rx.Observable.create(observer => {
    let running = false;
    const subscription = action$.filter(action => action.type === LIST_PRODUCTS_PRINT).subscribe(() => {
      if (running) {
        observer.next(successNotification(toast(
          'Already printing products',
          'A print is already running'
        )));
        return;
      }
      running = true;
      observer.next(successNotification(toast(
        'Printing products',
        'The product list will be printed in the background'
      )));
      printProductCatalog.execute(filtersFrom(store)).subscribe(
        value => {
          if (value && value.progress) {
            observer.next(catalogPrintProgressed(value.percent));
            return;
          }
          running = false;
          observer.next(catalogPrintFinished());
          if (!value || !value.printed) {
            observer.next(successNotification(toast(
              'Nothing to print',
              'No products match these filters'
            )));
            return;
          }
          const printed = value.printed;
          observer.next(successNotification(toast(
            'Products printed',
            printed === 1 ? 'Printed 1 product.' : `Printed ${printed} products.`
          )));
        },
        printError => {
          running = false;
          observer.next(catalogPrintFinished());
          observer.next(errorNotification(toast(
            'Could not print products',
            failureMessage(printError)
          )));
        }
      );
    });
    return () => subscription.unsubscribe();
  });
}
