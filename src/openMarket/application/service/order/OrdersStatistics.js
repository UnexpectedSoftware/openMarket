export default class OrdersStatistics {
  constructor ({repository}) {
    this._repository = repository;
  }

  countByDates({ startDate, endDate }){
    return this._repository.countByDates({startDate, endDate});
  }

  calculateTotalAmount ({startDate, endDate}){
    return this._repository.calculateTotalAmount({startDate, endDate});
  }

}
