export default class ListAllOrders {

  constructor({repository}){
    this._productRepository = repository;
  }

  findAllByDates({ limit, offset, startDate, endDate }) {
    return this._productRepository.findAllByDates({ limit, offset, startDate, endDate});
  }



}
