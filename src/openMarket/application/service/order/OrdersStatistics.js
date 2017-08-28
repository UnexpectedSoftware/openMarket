export default class OrdersStatistics {
  constructor ({repository}) {
    this._productRepository = repository;
  }

  countByDates({ startDate, endDate }){
    return this._productRepository.countByDates({startDate, endDate});
  }

  calculateTotalAmount ({startDate, endDate}){
    return this._productRepository.calculateTotalAmount({startDate, endDate});
  }

}
