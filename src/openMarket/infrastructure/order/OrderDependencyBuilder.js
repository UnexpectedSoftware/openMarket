import CreateOrder from "../../application/service/order/CreateOrder";
import LocalStorageOrderRepository from "./LocalStorageOrderRepository";
export default class OrderDependencyBuilder {

  static buildOrderRepository() {
    return new LocalStorageOrderRepository();
  }

  static buildCreateOrderUseCase() {
    return new CreateOrder({repository: OrderDependencyBuilder.buildOrderRepository()});
  }
}
