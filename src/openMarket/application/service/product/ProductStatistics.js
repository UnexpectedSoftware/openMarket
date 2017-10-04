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

  countProductsByName({name}){
    return this._productRepository.countProductsByName({name});
  }

  countProductsWithLowStock(){
    return this._productRepository.countProductsWithLowStock();
  }


}
