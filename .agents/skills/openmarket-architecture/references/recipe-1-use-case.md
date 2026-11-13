## Recipe 1: add a use case

A use case depends on ports. It does not import another use case and does not receive one in its constructor. A helper in the same folder, such as `salesWindows.js`, is fine.

Checklist:
1. `src/openMarket/application/service/<ctx>/<VerbNoun>.js`
2. Domain behaviour it needs: add a method on the aggregate (`domain/<ctx>/<Aggregate>.js`). Never put it in the use case or the repository.
3. A typed error if a new failure is possible (Recipe 5)
4. `infrastructure/dic/Container.js`: add a `_<verbNoun>()` factory
5. `application/index.js`: add `this.deps.set('<ctx-plural>_<action>_use_case', container.getInstance({key: '<verbNoun>'}))` if the UI calls it
6. A unit test at `src/test/openMarket/application/service/<ctx>/<VerbNoun>.spec.js`, plus an itest if it writes to SQLite

```js
// src/openMarket/application/service/product/AdjustStock.js
import * as Rx from 'rxjs';
import ProductNotFoundError from '../../../domain/product/ProductNotFoundError';
import observableError from '../../../infrastructure/logging/observableError';
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../../domain/product/ProductRepository').default} ProductRepository */
/** @typedef {import('../../../domain/product/Product').default} Product */

/**
 * Sets a counted stock level after a stocktake.
 */
export default class AdjustStock {

  /** @param {{productRepository: ProductRepository}} deps */
  constructor({productRepository}) {
    this._productRepository = productRepository;
  }

  /**
   * @param {{barcode: string, quantity: number}} command
   * @returns {Observable<Product>}
   */
  adjustStock({barcode, quantity}) {
    return this._productRepository.findByBarcode({barcode})
      .defaultIfEmpty(null)
      .flatMap(product => {
        if (!product) {
          return observableError(new ProductNotFoundError({barcode, operation: 'adjustStock'}));
        }
        product.addStock({quantity});          // behaviour lives on the aggregate
        return this._productRepository.save({product}).map(() => product);
      });
  }

}
```

Container and facade:
```js
// infrastructure/dic/Container.js
import AdjustStock from "../../application/service/product/AdjustStock";
  _adjustStock() {
    return new AdjustStock({productRepository: this.getInstance({key: 'productRepository'})});
  }
// application/index.js (constructor)
    this.deps.set('products_adjust_stock_use_case', container.getInstance({key:'adjustStock'}));
```

Unit test (fake the ports with plain objects):
```js
import {expect} from 'chai';
import * as Rx from 'rxjs';
import AdjustStock from '../../../../../openMarket/application/service/product/AdjustStock';
import ErrorCode from '../../../../../openMarket/domain/error/ErrorCode';

describe('AdjustStock', () => {
  it('fails with PRODUCT_NOT_FOUND for an unknown barcode', done => {
    const useCase = new AdjustStock({productRepository: {findByBarcode: () => Rx.Observable.empty()}});
    useCase.adjustStock({barcode: '0', quantity: 1}).subscribe(
      () => done(new Error('should fail')),
      error => { expect(error.code).to.equal(ErrorCode.PRODUCT_NOT_FOUND); done(); });
  });
});
```

Multiple writes (for example an order and the stock of every product) must commit together. Inject `transaction` (port `domain/service/Transaction.js`, container key `'transaction'`) and wrap the writes: `this._transaction.run(() => …writes…)`. Look at `application/service/order/CreateOrder.js`.
