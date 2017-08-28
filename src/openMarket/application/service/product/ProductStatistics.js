/**
 * @class ProductStatistics
 */
export default class ProductStatistics {
  constructor ({repository}) {
    this._productRepository = repository;
  }

  countProducts(){
    return this._productRepository.countProducts();
  }

  countProductsByName(){
    return this._productRepository.countProductsByName();
  }

  countProductsWithLowStock(){
    return this._productRepository.countProductsWithLowStock();
  }


}
