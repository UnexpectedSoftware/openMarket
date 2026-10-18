import * as Rx from "rxjs";
import {moneyFromColumns} from "../service/storedMoney";
/** @typedef {import('../../domain/product/ProductFactory').default} ProductFactory */
/** @typedef {import('../../domain/category/CategoryFactory').default} CategoryFactory */
/** @typedef {import('../../domain/product/Product').default} Product */
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */

export default class SqlProductMapper {

  /**
   * @param {object} deps
   * @param {ProductFactory} deps.productFactory
   * @param {CategoryFactory} deps.categoryFactory
   */
  constructor({ productFactory, categoryFactory }){
    this._productFactory = productFactory;
    this._categoryFactory = categoryFactory;
  }


  /**
   * @param persistenceProduct
   * @returns {Observable<Product>}
   */
  toDomain({persistenceProduct}) {
    return Rx.Observable.of(
      this._productFactory.createWith({
        barcode: persistenceProduct.barcode,
        basePrice: moneyFromColumns(persistenceProduct.base_price_cents, persistenceProduct.base_price),
        description: persistenceProduct.description,
        name: persistenceProduct.name,
        price: moneyFromColumns(persistenceProduct.price_cents, persistenceProduct.price),
        status: persistenceProduct.status,
        stock: persistenceProduct.stock,
        stockMin: persistenceProduct.stock_min,
        weighted: persistenceProduct.weighted,
        imageName: persistenceProduct.image_name,
        vatRate: {
          percent: persistenceProduct.vat_percent,
          kind: persistenceProduct.vat_kind,
          cause: persistenceProduct.vat_cause
        },
        category: this._categoryFactory.createWithId({
          id: persistenceProduct.category_id,
          name: persistenceProduct.category_name
        })
      })
    );
  }

}
