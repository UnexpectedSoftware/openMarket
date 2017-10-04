import ObjectMapper from "../service/ObjectMapper";
import * as Rx from "rxjs";

export default class MysqlProductMapper extends ObjectMapper{

  /**
   *
   * @param {ProductFactory} productFactory
   * @param {CategoryFactory} categoryFactory
   */
  constructor({ productFactory, categoryFactory }){
    super();
    this._productFactory = productFactory;
    this._categoryFactory = categoryFactory;
  }


  /**
   * @param persistenceProduct
   * @returns {Observable<Product>}
   */
  toDomain({persistenceProduct}) {
    return Rx.Observable.of(
      this._productFactory.createWithId({
        id: undefined,
        barcode: persistenceProduct.barcode,
        basePrice: persistenceProduct.base_price,
        description: persistenceProduct.description,
        name: persistenceProduct.name,
        price: persistenceProduct.price,
        status: persistenceProduct.status,
        stock: persistenceProduct.stock,
        stockMin: persistenceProduct.stock_min,
        weighted: persistenceProduct.weighted,
        category: this._categoryFactory.createWithId({
          id: persistenceProduct.category_id,
          name: persistenceProduct.category_name
        })
      })
    );
  }

  toPersistence({domainProduct}) {
    return super.toPersistence({domainProduct});
  }
}
