/**
 * @class ProductStatistics
 */
export default class ProductStatistics {
  constructor ({repository}) {
    this._repository = repository;
  }

  countProducts(){
    return this._repository.countProducts();
  }


}
