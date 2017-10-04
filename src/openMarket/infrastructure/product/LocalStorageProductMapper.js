import ObjectMapper from "../service/ObjectMapper";
import * as Rx from "rxjs";

export default class LocalStorageProductMapper extends ObjectMapper{

  /**
   *
   * @param {ProductFactory} productFactory
   * @param {CategoryRepository} categoryRepository
   */
  constructor({ productFactory, categoryRepository }){
    super();
    this._productFactory = productFactory;
    this._categoryRepository = categoryRepository;
  }

  /**
   *
   * @param persistenceProduct
   * @returns {Observable<Product>}
   */
  toDomain({ persistenceProduct }){
    return this._categoryRepository.findById({ id:persistenceProduct._categoryId })
      .map(category => this._productFactory.createWithId({
        id: persistenceProduct._id,
        barcode: persistenceProduct._barcode,
        name: persistenceProduct._name,
        description: persistenceProduct._description,
        price: persistenceProduct._price,
        basePrice: persistenceProduct._basePrice,
        stock: persistenceProduct._stock,
        stockMin: persistenceProduct._stockMin,
        category: category,
        weighted: persistenceProduct._weighted,
        status: persistenceProduct._status
      }));
  }

  toPersistence({ domainProduct }){
    return Rx.Observable.of(domainProduct)
      .map(product => ({
        "_id":product.id,
        "_barcode":product.barcode,
        "_name":product.name,
        "_description":product.description,
        "_price":product.price,
        "_basePrice":product.basePrice,
        "_stock":product.stock,
        "_stockMin":product.stockMin,
        "_categoryId":product.category.id,
        "_status":product.status
      }));
  }
}
