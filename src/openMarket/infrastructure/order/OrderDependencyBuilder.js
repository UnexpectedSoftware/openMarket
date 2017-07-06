import CreateOrder from "../../application/service/order/CreateOrder";
import LocalStorageOrderRepository from "./LocalStorageOrderRepository";
import OrderFactoryImpl from "./OrderFactoryImpl";
import UUIDGenerator from "../UUIDGenerator";
import ListAllOrders from "../../application/service/order/ListAllOrders";
export default class OrderDependencyBuilder {

  static buildOrderRepository() {
    return new LocalStorageOrderRepository({
      orderFactory: OrderDependencyBuilder.buildOrderFactory()
    });
  }

  static buildCreateOrderUseCase() {
    return new CreateOrder({repository: OrderDependencyBuilder.buildOrderRepository()});
  }

  static buildOrderFactory() {
    return new OrderFactoryImpl(
      {
        identity: new UUIDGenerator()
    });
  }

  static buildListAllOrdersUseCase() {
    return new ListAllOrders({repository: OrderDependencyBuilder.buildOrderRepository() });
  }
}
