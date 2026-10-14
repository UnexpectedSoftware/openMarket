/** @import { Observable } from 'rxjs/Observable' */
/** @import ProductRepository from '../../../domain/product/ProductRepository' */

/**
 * @class ProductStatistics
 */
export default class ProductStatistics {
  /**
   * @param {{repository: ProductRepository}} deps
   */
  constructor ({repository}) {
    this._productRepository = repository;
  }

  /**
   * @returns {Observable<number>}
   */
  countProducts(){
    return this._productRepository.countProducts();
  }

  /**
   * @param {{name: string}} query
   * @returns {Observable<number>}
   */
  countProductsByName({name}){
    return this._productRepository.countProductsByName({name});
  }

  /**
   * @returns {Observable<number>}
   */
  countProductsWithLowStock(){
    return this._productRepository.countProductsWithLowStock();
  }


}
