export default class ListAllOrders {

  constructor({repository}){
    this._repository = repository;
  }

  findAll({ limit, offset }) {
    return this._repository.findAll({ limit, offset});
  }

}
