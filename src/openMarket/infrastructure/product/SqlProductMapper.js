import * as Rx from "rxjs";
import {moneyFromColumns} from "../service/storedMoney";
import Product from "../../domain/product/Product";
/** @typedef {import('../../domain/category/CategoryFactory').default} CategoryFactory */
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */

export default class SqlProductMapper {

  /**
   * @param {object} deps
   * @param {CategoryFactory} deps.categoryFactory
   */
  constructor({ categoryFactory }){
    this._categoryFactory = categoryFactory;
  }


  /**
   * @param persistenceProduct
   * @returns {Observable<Product>}
   */
  toDomain({persistenceProduct}) {
    return Rx.Observable.of(
      Product.restore({
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
