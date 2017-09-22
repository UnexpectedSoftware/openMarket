import MysqlConnection from "../service/MysqlConnection";
import FixturesService from "../service/FixturesService";
import PrinterConnection from "../printer/PrinterConnection";
import OrderPrinterService from "../printer/OrderPrinterService";
import MysqlCategoryRepository from "../category/MysqlCategoryRepository";
import LocalStorageCategoryRepository from "../category/LocalStorageCategoryRepository";
import CategoryFactoryImpl from "../category/CategoryFactoryImpl";
import UUIDIdentity from "../service/UUIDIdentity";
import ListAllCategories from "../../application/service/category/ListAllCategories";
import FindCategoryById from "../../application/service/category/FindCategoryById";
import CreateCategory from "../../application/service/category/CreateCategory";
import UpdateCategory from "../../application/service/category/UpdateCategory";
import ProductStatistics from "../../application/service/product/ProductStatistics";
import ListAllProducts from "../../application/service/product/ListAllProducts";
import LocalStorageProductRepository from "../product/LocalStorageProductRepository";
import ProductMapper from "../product/ProductMapper";
import AddStock from "../../application/service/product/AddStock";
import CreateOrUpdateProduct from "../../application/service/product/CreateOrUpdateProduct";
import FindProduct from "../../application/service/product/FindProduct";
import MysqlProductRepository from "../product/MysqlProductRepository";
import LocalStorageOrderRepository from "../order/LocalStorageOrderRepository";
import CreateOrder from "../../application/service/order/CreateOrder";
import ListAllOrders from "../../application/service/order/ListAllOrders";
import OrdersStatistics from "../../application/service/order/OrdersStatistics";
import OrderFactoryImpl from "../order/OrderFactoryImpl";
import ProductFactoryImpl from "../product/ProductFactoryImpl";
import ProductFilterFactoryImpl from "../product/ProductFilterFactoryImpl";

const env = process.env.NODE_ENV

class Container {
  constructor({environment}) {
    this._environment = environment;
  }

  mysqlConnection(){
    return new MysqlConnection({});
  }

  fixturesService() {
    return new FixturesService();
  }

  printerConnection(){
    return new PrinterConnection();
  }

  orderPrinterService(){
    return new OrderPrinterService({printerConnection: this.printerConnection()});
  }

  categoryRepository() {
    switch(this._environment) {
      case 'production':
        return new MysqlCategoryRepository({
          connection: this.mysqlConnection(),
          categoryFactory: this.categoryFactory()
        });
      default:
        return new LocalStorageCategoryRepository({ categoryFactory: this.categoryFactory() });
    }
  }

  /**
   *
   * @returns {ListAllCategories}
   */
  listAllCategories() {
    return new ListAllCategories({ repository: this.categoryRepository() });
  }

  /**
   *
   * @returns {FindCategoryById}
   */
  findCategoryById() {
    return new FindCategoryById({ repository: this.categoryRepository() });
  }


  uuidIdentity() {
    return new UUIDIdentity();
  }

  /**
   *
   * @returns {CategoryFactoryImpl}
   */
  categoryFactory() {
    return new CategoryFactoryImpl({ identity: this.uuidIdentity() });
  }

  /**
   *
   * @returns {CreateCategory}
   */
  createCategory() {
    return new CreateCategory({ repository: this.categoryRepository() });
  }

  /**
   *
   * @returns {UpdateCategory}
   */
  updateCategory() {
    return new UpdateCategory({ repository: this.categoryRepository() });
  }

  /**
   *
   * @returns {ProductFilterFactoryImpl}
   */
  productFilterFactory() {
    return new ProductFilterFactoryImpl();
  }

  productRepository() {
    switch(this._environment) {
      case 'production':
        return new MysqlProductRepository({
          connection: this.mysqlConnection(),
          productMapper: this.productMapper()
        });
      default:
        return new LocalStorageProductRepository({ productMapper: this.productMapper() });
    }
  }

  /**
   *
   * @returns {ListAllProducts}
   */
  listAllProductsUseCase() {
    return new ListAllProducts({
      repository: this.productRepository(),
      productFilterFactory: this.productFilterFactory()
    });
  }

  productStatisticsUseCase(){
    return new ProductStatistics({
      repository: this.productRepository()
    });
  }

  /**
   *
   * @returns {ProductFactoryImpl}
   */
  productFactory() {
    return new ProductFactoryImpl({ identity: this.uuidIdentity() });
  }

  findProductsUseCase() {
    return new FindProduct({
      repository: this.productRepository()
    });
  }

  createProduct() {
    return new CreateOrUpdateProduct({
      productRepository: this.productRepository(),
      productFactory: this.productFactory(),
      categoryRepository: this.categoryRepository()
    });
  }

  addStockProduct() {
    return new AddStock({
      repository: this.productRepository()
    });
  }

  productMapper() {
    return new ProductMapper({
      productFactory: this.productFactory(),
      categoryRepository: this.categoryRepository()
    });
  }

  orderRepository() {
    return new LocalStorageOrderRepository({
      orderFactory: this.orderFactory()
    });
  }

  createOrderUseCase() {
    return new CreateOrder({
      orderRepository: this.orderRepository(),
      productRepository: this.productRepository(),
      orderFactory: this.orderFactory()
    });
  }

  orderFactory() {
    return new OrderFactoryImpl({ identity: this.uuidIdentity() });
  }

  listAllOrdersUseCase() {
    return new ListAllOrders({repository: this.orderRepository() });
  }

  orderStatisticsUseCase() {
    return new OrdersStatistics({repository: this.orderRepository()});
  }

}

const staticContainer = new Container({environment: env});

export default staticContainer;
