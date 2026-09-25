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
import LocalStorageProductMapper from "../product/LocalStorageProductMapper";
import SqlProductMapper from "../product/SqlProductMapper";
import EnvironmentService from "../service/EnvironmentService";
import baseConfig from '../../../resources/application.json'
import dev from '../../../resources/application-dev.json'
import pro from '../../../resources/application-pro.json'
import MysqlOrderRepository from "../order/MysqlOrderRepository";
import SqlOrderMapper from "../order/SqlOrderMapper";
import MysqlPool from "../service/MysqlPool";
import SqliteConnection from "../service/SqliteConnection";
import SqliteCategoryRepository from "../category/SqliteCategoryRepository";
import SqliteProductRepository from "../product/SqliteProductRepository";
import SqliteOrderRepository from "../order/SqliteOrderRepository";
const env = process.env.NODE_ENV
const storeOverride = process.env.OPENMARKET_STORE

class Container {
  constructor({environment}) {
    this._environment = new EnvironmentService({
      nodeEnvironment:environment,
      baseConfig,
      devConfig:dev,
      proConfig:pro,
      storeOverride
    });
    this._instances = new Map();
  }

  getInstance({key}){
    if (undefined === this._instances.get(key)){
      this._instances.set(key,this['_'+key]())
    }
    return this._instances.get(key);
  }

  get environment() {
    return this._environment;
  }

  _mysqlConnection(){
    return new MysqlConnection({pool$: this.getInstance({key: 'mysqlPool'})});
  }

  _mysqlPool(){
    return new MysqlPool({config:this._environment.config})
  }

  _sqliteConnection() {
    return new SqliteConnection();
  }

  _fixturesService() {
    const store = this._environment.config.store;
    let demoCatalog = null;
    let demoOrders = null;
    if (process.env.NODE_ENV === 'development' && store === 'Sqlite') {
      demoCatalog = require('../service/demoCatalog');
      demoOrders = require('../service/demoOrders');
    }
    return new FixturesService({
      database: store === 'Sqlite' ? this.getInstance({key: 'sqliteConnection'}).database : null,
      demoCatalog,
      demoOrders
    });
  }

  _printerConnection(){
    return new PrinterConnection();
  }

  _orderPrinterService(){
    return new OrderPrinterService({printerConnection: this.getInstance({key: 'printerConnection'})});
  }

  _categoryRepository() {
    switch(this._environment.config.store) {
      case 'Mysql':
        return new MysqlCategoryRepository({
          connection: this.getInstance({key: 'mysqlConnection'}),
          categoryFactory: this.getInstance({key: 'categoryFactory'})
        });
      case 'LocalStorage':
        return new LocalStorageCategoryRepository({ categoryFactory: this.getInstance({key: 'categoryFactory'})});
      case 'Sqlite':
        return new SqliteCategoryRepository({
          connection: this.getInstance({key: 'sqliteConnection'}),
          categoryFactory: this.getInstance({key: 'categoryFactory'})
        });
      default:
        throw new Error('Unsupported implementation!');
    }
  }

  /**
   *
   * @returns {ListAllCategories}
   */
  _listAllCategories() {
    return new ListAllCategories({ repository: this.getInstance({key: 'categoryRepository'})});
  }

  /**
   *
   * @returns {FindCategoryById}
   */
  _findCategoryById() {
    return new FindCategoryById({ repository: this.getInstance({key: 'categoryRepository'}) });
  }


  _uuidIdentity() {
    return new UUIDIdentity();
  }

  /**
   *
   * @returns {CategoryFactoryImpl}
   */
  _categoryFactory() {
    return new CategoryFactoryImpl({ identity: this.getInstance({key: 'uuidIdentity'}) });
  }

  /**
   *
   * @returns {CreateCategory}
   */
  _createCategory() {
    return new CreateCategory({ repository: this.getInstance({key: 'categoryRepository'}) });
  }

  /**
   *
   * @returns {UpdateCategory}
   */
  _updateCategory() {
    return new UpdateCategory({ repository: this.getInstance({key: 'categoryRepository'}) });
  }

  /**
   *
   * @returns {ProductFilterFactoryImpl}
   */
  _productFilterFactory() {
    return new ProductFilterFactoryImpl();
  }

  _productRepository() {
    switch(this._environment.config.store) {
      case 'Mysql':
        return new MysqlProductRepository({
          connection: this.getInstance({key: 'mysqlConnection'}),
          productMapper: this.getInstance({key: 'productMapper'})
        });
      case 'LocalStorage':
        return new LocalStorageProductRepository({ productMapper: this.getInstance({key: 'productMapper'})});
      case 'Sqlite':
        return new SqliteProductRepository({
          connection: this.getInstance({key: 'sqliteConnection'}),
          productMapper: this.getInstance({key: 'productMapper'})
        });
      default:
        throw new Error('Unsupported implementation!');
    }
  }

  /**
   *
   * @returns {ListAllProducts}
   */
  _listAllProductsUseCase() {
    return new ListAllProducts({
      repository: this.getInstance({key: 'productRepository'}),
      productFilterFactory: this.getInstance({key: 'productFilterFactory'})
    });
  }

  _productStatisticsUseCase(){
    return new ProductStatistics({
      repository: this.getInstance({key: 'productRepository'})
    });
  }

  /**
   *
   * @returns {ProductFactoryImpl}
   */
  _productFactory() {
    return new ProductFactoryImpl({ identity: this.getInstance({key: 'uuidIdentity'}) });
  }

  _findProductsUseCase() {
    return new FindProduct({
      repository: this.getInstance({key: 'productRepository'})
    });
  }

  _createProduct() {
    return new CreateOrUpdateProduct({
      productRepository: this.getInstance({key: 'productRepository'}),
      productFactory: this.getInstance({key: 'productFactory'}),
      categoryRepository: this.getInstance({key: 'categoryRepository'})
    });
  }

  _addStockProduct() {
    return new AddStock({
      repository: this.getInstance({key: 'productRepository'})
    });
  }

  _productMapper() {
    switch(this._environment.config.store) {
      case 'Mysql':
      case 'Sqlite':
        return new SqlProductMapper({
          productFactory: this.getInstance({key: 'productFactory'}),
          categoryFactory: this.getInstance({key: 'categoryFactory'})
        });
      case 'LocalStorage':
        return new LocalStorageProductMapper({
          productFactory: this.getInstance({key: 'productFactory'}),
          categoryRepository: this.getInstance({key: 'categoryRepository'})
        });
      default:
        throw new Error('Unsupported implementation!');
    }
  }

  _orderRepository() {
    switch(this._environment.config.store) {
      case 'Mysql':
        return new MysqlOrderRepository({
          connection: this.getInstance({key: 'mysqlConnection'}),
          objectMapper: this.getInstance({key: 'orderMapper'})
        });
      case 'LocalStorage':
        return new LocalStorageOrderRepository({
          orderFactory: this.getInstance({key: 'orderFactory'})
        });
      case 'Sqlite':
        return new SqliteOrderRepository({
          connection: this.getInstance({key: 'sqliteConnection'}),
          objectMapper: this.getInstance({key: 'orderMapper'})
        });
      default:
        throw new Error('Unsupported implementation!');
    }
  }

  _orderMapper(){
    return new SqlOrderMapper({
      orderFactory: this.getInstance({key: 'orderFactory'})
    });
  }

  _createOrderUseCase() {
    return new CreateOrder({
      orderRepository: this.getInstance({key: 'orderRepository'}),
      productRepository: this.getInstance({key: 'productRepository'}),
      orderFactory: this.getInstance({key: 'orderFactory'})
    });
  }

  _orderFactory() {
    return new OrderFactoryImpl({ identity: this.getInstance({key: 'uuidIdentity'})});
  }

  _listAllOrdersUseCase() {
    return new ListAllOrders({repository: this.getInstance({key: 'orderRepository'}) });
  }

  _orderStatisticsUseCase() {
    return new OrdersStatistics({repository: this.getInstance({key: 'orderRepository'})});
  }

}

const staticContainer = new Container({environment: env});

export default staticContainer;
