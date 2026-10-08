import {expect} from 'chai';
import * as Rx from 'rxjs';
import {makePrintCatalogEpic} from '../../../../../openMarket/user_interface/product/list_products/printEpic';
import {LIST_PRODUCTS_PRINT} from '../../../../../openMarket/user_interface/product/list_products/action';

function harness(execute) {
  const emitted = [];
  let executions = 0;
  const epic = makePrintCatalogEpic({
    printProductCatalog: {
      execute: (filters) => {
        executions += 1;
        return execute(filters);
      }
    },
    successNotification: payload => ({type: 'SUCCESS', payload}),
    errorNotification: payload => ({type: 'ERROR', payload}),
    catalogPrintProgressed: percent => ({type: 'CATALOG_PRINT_PROGRESSED', percent}),
    catalogPrintFinished: () => ({type: 'CATALOG_PRINT_FINISHED'})
  });
  const store = {
    getState: () => ({
      listProducts: {
        query: 'milk',
        lowStock: true,
        status: 'ENABLED',
        categoryId: '2',
        sort: 'stock_asc',
        categories: [{id: '2', name: 'Dairy'}]
      }
    })
  };
  const actions = new Rx.Subject();
  epic(actions, store).subscribe(action => emitted.push(action));
  return {
    emitted,
    print: () => actions.next({type: LIST_PRODUCTS_PRINT}),
    executions: () => executions
  };
}

describe('Print catalog epic', () => {
  it('shows progress and the finished toast for the filters on screen', () => {
    let push = null;
    let seen = null;
    const {emitted, print} = harness((filters) => {
      seen = filters;
      return Rx.Observable.create(observer => {
        push = observer;
      });
    });
    print();
    expect(seen).to.include({
      query: 'milk',
      lowStock: true,
      status: 'ENABLED',
      categoryId: '2',
      sort: 'stock_asc',
      categoryName: 'Dairy'
    });
    expect(seen.printedAt).to.be.a('string');
    expect(emitted[0].payload).to.include({
      title: 'Printing products',
      message: 'The product list will be printed in the background',
      position: 'tr',
      autoDismiss: 4
    });
    push.next({progress: true, completed: 1, total: 2, percent: 50});
    expect(emitted[1]).to.deep.equal({type: 'CATALOG_PRINT_PROGRESSED', percent: 50});
    push.next({printed: 2});
    push.complete();
    expect(emitted[2]).to.deep.equal({type: 'CATALOG_PRINT_FINISHED'});
    expect(emitted[3].payload).to.include({
      title: 'Products printed',
      message: 'Printed 2 products.'
    });
  });

  it('does not reset a running print', () => {
    let push = null;
    const {emitted, print, executions} = harness(() => Rx.Observable.create(observer => {
      push = observer;
    }));
    print();
    print();
    expect(executions()).to.equal(1);
    expect(emitted[1].payload.title).to.equal('Already printing products');
    push.next({progress: true, percent: 10});
    expect(emitted[2]).to.deep.equal({type: 'CATALOG_PRINT_PROGRESSED', percent: 10});
    push.next({printed: 1});
    push.complete();
    expect(emitted[3]).to.deep.equal({type: 'CATALOG_PRINT_FINISHED'});
  });

  it('toasts when nothing matches and hides the indicator after a partial failure', () => {
    const empty = harness(() => Rx.Observable.of({printed: 0}));
    empty.print();
    expect(empty.emitted.map(action => action.type)).to.deep.equal([
      'SUCCESS',
      'CATALOG_PRINT_FINISHED',
      'SUCCESS'
    ]);
    expect(empty.emitted[2].payload.title).to.equal('Nothing to print');
    expect(empty.emitted.some(action => action.type === 'CATALOG_PRINT_PROGRESSED')).to.equal(false);

    const failure = new Error('Printer is busy');
    failure.printed = 20;
    failure.total = 140;
    const failed = harness(() => Rx.Observable.throw(failure));
    failed.print();
    expect(failed.emitted[1]).to.deep.equal({type: 'CATALOG_PRINT_FINISHED'});
    expect(failed.emitted[2].payload).to.include({
      title: 'Could not print products',
      message: 'Printed 20 of 140. Printer is busy'
    });
  });
});
