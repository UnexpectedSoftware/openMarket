export default class ListAllOrders {

  constructor({repository}){
    this._repository = repository;
  }

  findAllByDates({ limit, offset, startDate, endDate }) {
    return this._repository.findAllByDates({ limit, offset, startDate, endDate});
  }



}
