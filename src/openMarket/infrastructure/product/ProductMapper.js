import * as Rx from "rxjs";

export default class ProductMapper {

  /**
   *
   * @param {ProductFactory} productFactory
   */
  constructor({ productFactory, categoryRepository }){
    this._productFactory = productFactory;
    this._categoryRepository = categoryRepository;
  }

  /**
   *
   * @param jsonProduct
   * @returns {Observable<Product>}
   */
  toDomain({ jsonProduct }){
    return this._categoryRepository.findById({ id:jsonProduct._categoryId })
      .map(category => this._productFactory.createWithId({
        id: jsonProduct._id,
        barcode: jsonProduct._barcode,
        name: jsonProduct._name,
        description: jsonProduct._description,
        price: jsonProduct._price,
        basePrice: jsonProduct._basePrice,
        stock: jsonProduct._stock,
        stockMin: jsonProduct._stockMin,
        category: category,
        weighted: jsonProduct._weighted,
        status: jsonProduct._status
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
