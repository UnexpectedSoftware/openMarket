import CreateOrder from "../../application/service/order/CreateOrder";
import LocalStorageOrderRepository from "./LocalStorageOrderRepository";
import OrderFactoryImpl from "./OrderFactoryImpl";
import UUIDIdentity from "../service/UUIDIdentity";
import ListAllOrders from "../../application/service/order/ListAllOrders";
import OrdersStatistics from "../../application/service/order/OrdersStatistics";
import ProductDependencyBuilder from "../product/ProductDependencyBuilder";

export default class OrderDependencyBuilder {

  static buildOrderRepository() {
    return new LocalStorageOrderRepository({
      orderFactory: OrderDependencyBuilder.buildOrderFactory()
    });
  }

  static buildCreateOrderUseCase() {
    return new CreateOrder({
      orderRepository: OrderDependencyBuilder.buildOrderRepository(),
      productRepository: ProductDependencyBuilder.buildProductRepository(),
      orderFactory: OrderDependencyBuilder.buildOrderFactory()
    });
  }

  static buildOrderFactory() {
    return new OrderFactoryImpl(
      {
        identity: new UUIDIdentity()
    });
  }

  static buildListAllOrdersUseCase() {
    return new ListAllOrders({repository: OrderDependencyBuilder.buildOrderRepository() });
  }

  static buildOrderStatisticsUseCase() {
    return new OrdersStatistics({repository: OrderDependencyBuilder.buildOrderRepository()});
  }
}
