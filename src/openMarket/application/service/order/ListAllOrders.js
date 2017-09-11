export default class ListAllOrders {

  constructor({repository}){
    this._orderRepository = repository;
  }

  findAllByDates({ limit, offset, startDate, endDate }) {
    return this._orderRepository.findAllByDates({ limit, offset, startDate, endDate});
  }

  findById({ id }){
    return this._orderRepository.findById({id});
  }



}
