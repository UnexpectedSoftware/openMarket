import PrinterConnection from "../printer/PrinterConnection";
import OrderPrinterService from "../printer/OrderPrinterService";
import CategoryFactoryImpl from "../category/CategoryFactoryImpl";
import UUIDIdentity from "../service/UUIDIdentity";
import ListAllCategories from "../../application/service/category/ListAllCategories";
import FindCategoryById from "../../application/service/category/FindCategoryById";
import CreateCategory from "../../application/service/category/CreateCategory";
import UpdateCategory from "../../application/service/category/UpdateCategory";
import ProductStatistics from "../../application/service/product/ProductStatistics";
import ListAllProducts from "../../application/service/product/ListAllProducts";
import AddStock from "../../application/service/product/AddStock";
import CreateOrUpdateProduct from "../../application/service/product/CreateOrUpdateProduct";
import FindProduct from "../../application/service/product/FindProduct";
import CreateOrder from "../../application/service/order/CreateOrder";
import ListAllOrders from "../../application/service/order/ListAllOrders";
import OrdersStatistics from "../../application/service/order/OrdersStatistics";
import OrderFactoryImpl from "../order/OrderFactoryImpl";
import ProductFactoryImpl from "../product/ProductFactoryImpl";
import ProductFilterFactoryImpl from "../product/ProductFilterFactoryImpl";
import SqlProductMapper from "../product/SqlProductMapper";
import EnvironmentService from "../service/EnvironmentService";
import baseConfig from '../../../resources/application.json'
import dev from '../../../resources/application-dev.json'
import pro from '../../../resources/application-pro.json'
import SqlOrderMapper from "../order/SqlOrderMapper";
import SqliteConnection from "../service/SqliteConnection";
import SqliteCategoryRepository from "../category/SqliteCategoryRepository";
import ImageStore, {imagesDirectory} from "../service/ImageStore";
import SqliteProductRepository from "../product/SqliteProductRepository";
import SqliteOrderRepository from "../order/SqliteOrderRepository";
import { createFixturesService } from "../dev";
import OpenFoodFactsProductImageSource from "../image/OpenFoodFactsProductImageSource";
import WikimediaCategoryImageSource from "../image/WikimediaCategoryImageSource";
import FetchCatalogImages from "../../application/service/image/FetchCatalogImages";
const env = process.env.NODE_ENV

class Container {
  constructor({environment}) {
    this._environment = new EnvironmentService({
      nodeEnvironment:environment,
      baseConfig,
      devConfig:dev,
      proConfig:pro
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

  _sqliteConnection() {
    return new SqliteConnection();
  }

  _fixturesService() {
    return createFixturesService({
      database: this.getInstance({key: 'sqliteConnection'}).database
    });
  }

  _printerConnection(){
    return new PrinterConnection();
  }

  _orderPrinterService(){
    return new OrderPrinterService({printerConnection: this.getInstance({key: 'printerConnection'})});
  }

  _categoryImageStore() {
    return new ImageStore({directory: imagesDirectory('category-images')});
  }

  _productImageStore() {
    return new ImageStore({directory: imagesDirectory('product-images')});
  }

  _categoryRepository() {
    return new SqliteCategoryRepository({
      connection: this.getInstance({key: 'sqliteConnection'}),
      categoryFactory: this.getInstance({key: 'categoryFactory'}),
      images: this.getInstance({key: 'categoryImageStore'})
    });
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
    return new SqliteProductRepository({
      connection: this.getInstance({key: 'sqliteConnection'}),
      productMapper: this.getInstance({key: 'productMapper'}),
      images: this.getInstance({key: 'productImageStore'})
    });
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
    return new SqlProductMapper({
      productFactory: this.getInstance({key: 'productFactory'}),
      categoryFactory: this.getInstance({key: 'categoryFactory'})
    });
  }

  _orderRepository() {
    return new SqliteOrderRepository({
      connection: this.getInstance({key: 'sqliteConnection'}),
      objectMapper: this.getInstance({key: 'orderMapper'})
    });
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

  _productImageSource() {
    return new OpenFoodFactsProductImageSource();
  }

  _categoryImageSource() {
    return new WikimediaCategoryImageSource();
  }

  /**
   * @returns {FetchCatalogImages}
   */
  _fetchCatalogImages() {
    return new FetchCatalogImages({
      categoryRepository: this.getInstance({key: 'categoryRepository'}),
      productRepository: this.getInstance({key: 'productRepository'}),
      categoryImageSource: this.getInstance({key: 'categoryImageSource'}),
      productImageSource: this.getInstance({key: 'productImageSource'})
    });
  }

}

const staticContainer = new Container({environment: env});

export default staticContainer;
