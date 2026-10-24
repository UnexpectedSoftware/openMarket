import PrinterConnection from "../printer/PrinterConnection";
import OrderPrinterService from "../printer/OrderPrinterService";
import EscPosReceiptRenderer from "../printer/EscPosReceiptRenderer";
import HtmlReceiptRenderer from "../receipt/HtmlReceiptRenderer";
import ReceiptSlots from "../receipt/ReceiptSlots";
import BuildReceipt from "../../application/service/receipt/BuildReceipt";
import PrintReceipt from "../../application/service/receipt/PrintReceipt";
import CatalogPrinterService from "../printer/CatalogPrinterService";
import CategoryFactoryImpl from "../category/CategoryFactoryImpl";
import RandomUUIDIdentity from "../../domain/RandomUUIDIdentity";
import ListAllCategories from "../../application/service/category/ListAllCategories";
import FindCategoryById from "../../application/service/category/FindCategoryById";
import CreateCategory from "../../application/service/category/CreateCategory";
import UpdateCategory from "../../application/service/category/UpdateCategory";
import DeleteCategory from "../../application/service/category/DeleteCategory";
import ProductStatistics from "../../application/service/product/ProductStatistics";
import ProductSaleStatistics from "../../application/service/product/ProductSaleStatistics";
import RecordProductSales from "../../application/service/product/RecordProductSales";
import ListAllProducts from "../../application/service/product/ListAllProducts";
import AddStock from "../../application/service/product/AddStock";
import CreateOrUpdateProduct from "../../application/service/product/CreateOrUpdateProduct";
import DisableProduct from "../../application/service/product/DisableProduct";
import EnableProduct from "../../application/service/product/EnableProduct";
import FindProduct from "../../application/service/product/FindProduct";
import CreateOrder from "../../application/service/order/CreateOrder";
import CancelInvoice from "../../application/service/invoice/CancelInvoice";
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
import {record} from "../logging/ErrorLog";
import SqliteCategoryRepository from "../category/SqliteCategoryRepository";
import SqliteCategoryQueryService from "../category/SqliteCategoryQueryService";
import ImageStore, {dataUrlForFile, imagesDirectory} from "../service/ImageStore";
import SqliteProductRepository from "../product/SqliteProductRepository";
import SqliteProductQueryService from "../product/SqliteProductQueryService";
import SqliteProductSaleStatisticsRepository from "../product/SqliteProductSaleStatisticsRepository";
import SqliteProductSaleQueryService from "../product/SqliteProductSaleQueryService";
import SqliteOrderRepository from "../order/SqliteOrderRepository";
import SqliteOrderQueryService from "../order/SqliteOrderQueryService";
import SqlInvoiceMapper from "../invoice/SqlInvoiceMapper";
import SqliteInvoiceRepository from "../invoice/SqliteInvoiceRepository";
import SqliteInvoiceSequence from "../invoice/SqliteInvoiceSequence";
import { createFixturesService } from "../dev";
import OpenFoodFactsProductImageSource from "../image/OpenFoodFactsProductImageSource";
import WikimediaCategoryImageSource from "../image/WikimediaCategoryImageSource";
import FetchCatalogImages from "../../application/service/image/FetchCatalogImages";
import FindProductImage from "../../application/service/image/FindProductImage";
import PrintProductCatalog from "../../application/service/product/PrintProductCatalog";
import DomainEventBus from "../../domain/service/DomainEventBus";
import DomainEventDispatcher from "../event/DomainEventDispatcher";
import SqliteDomainEventRepository from "../event/SqliteDomainEventRepository";
import SqliteTransaction from "../service/SqliteTransaction";
import SystemClock from "../service/SystemClock";
import {eventClasses} from "../../domain/event/registry";
import ListPlugins from "../../application/service/plugin/ListPlugins";
import SavePlugin from "../../application/service/plugin/SavePlugin";
import pluginDirectory from "../plugins/pluginDirectory";
import FolderPluginSource from "../plugins/FolderPluginSource";
import SqlitePluginRepository from "../plugins/SqlitePluginRepository";
import PluginHost from "../plugins/PluginHost";
import loadPlugin from "../plugins/loadPlugin";
import SafeStorageSecretStore from "../plugins/SafeStorageSecretStore";
import {electronSecretBridge} from "../plugins/electronSecretBridge";
import SqliteShopProfileRepository from "../shop/SqliteShopProfileRepository";
import GetShopProfile from "../../application/service/shop/GetShopProfile";
import UpdateShopProfile from "../../application/service/shop/UpdateShopProfile";
import SqliteSellPreferencesRepository from "../shop/SqliteSellPreferencesRepository";
import GetSellPreferences from "../../application/service/shop/GetSellPreferences";
import UpdateSellPreferences from "../../application/service/shop/UpdateSellPreferences";
import SqliteAppearancePreferencesRepository from "../appearance/SqliteAppearancePreferencesRepository";
import GetAppearancePreferences from "../../application/service/appearance/GetAppearancePreferences";
import ChangeTheme from "../../application/service/appearance/ChangeTheme";
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

  _receiptSlots() {
    return new ReceiptSlots();
  }

  _escPosReceiptRenderer() {
    return new EscPosReceiptRenderer();
  }

  _htmlReceiptRenderer() {
    return new HtmlReceiptRenderer();
  }

  _orderPrinterService(){
    return new OrderPrinterService({
      printerConnection: this.getInstance({key: 'printerConnection'}),
      renderer: this.getInstance({key: 'escPosReceiptRenderer'})
    });
  }

  _buildReceipt() {
    return new BuildReceipt({
      invoiceRepository: this.getInstance({key: 'invoiceRepository'}),
      receiptSlots: this.getInstance({key: 'receiptSlots'}),
      recordError: record,
      htmlReceiptRenderer: this.getInstance({key: 'htmlReceiptRenderer'})
    });
  }

  _printReceipt() {
    return new PrintReceipt({
      orderPrinterService: this.getInstance({key: 'orderPrinterService'})
    });
  }

  _catalogPrinterService(){
    return new CatalogPrinterService({printerConnection: this.getInstance({key: 'printerConnection'})});
  }

  _printProductCatalog(){
    return new PrintProductCatalog({
      productRepository: this.getInstance({key: 'productRepository'}),
      catalogPrinter: this.getInstance({key: 'catalogPrinterService'})
    });
  }

  _categoryImageStore() {
    return new ImageStore({directory: imagesDirectory('category-images')});
  }

  _productImageStore() {
    return new ImageStore({directory: imagesDirectory('product-images')});
  }

  _sqliteCategoryQueryService() {
    return new SqliteCategoryQueryService();
  }

  _categoryRepository() {
    return new SqliteCategoryRepository({
      connection: this.getInstance({key: 'sqliteConnection'}),
      categoryFactory: this.getInstance({key: 'categoryFactory'}),
      images: this.getInstance({key: 'categoryImageStore'}),
      queryService: this.getInstance({key: 'sqliteCategoryQueryService'})
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


  _randomUUIDIdentity() {
    return new RandomUUIDIdentity();
  }

  /**
   *
   * @returns {CategoryFactoryImpl}
   */
  _categoryFactory() {
    return new CategoryFactoryImpl({ identity: this.getInstance({key: 'randomUUIDIdentity'}) });
  }

  /**
   *
   * @returns {CreateCategory}
   */
  _createCategory() {
    return new CreateCategory({
      repository: this.getInstance({key: 'categoryRepository'}),
      categoryFactory: this.getInstance({key: 'categoryFactory'})
    });
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
   * @returns {DeleteCategory}
   */
  _deleteCategory() {
    return new DeleteCategory({ repository: this.getInstance({key: 'categoryRepository'}) });
  }

  /**
   *
   * @returns {ProductFilterFactoryImpl}
   */
  _productFilterFactory() {
    return new ProductFilterFactoryImpl();
  }

  _sqliteProductQueryService() {
    return new SqliteProductQueryService();
  }

  _productRepository() {
    return new SqliteProductRepository({
      connection: this.getInstance({key: 'sqliteConnection'}),
      productMapper: this.getInstance({key: 'productMapper'}),
      images: this.getInstance({key: 'productImageStore'}),
      queryService: this.getInstance({key: 'sqliteProductQueryService'})
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

  _sqliteProductSaleQueryService() {
    return new SqliteProductSaleQueryService();
  }

  _productSaleStatisticsRepository() {
    return new SqliteProductSaleStatisticsRepository({
      connection: this.getInstance({key: 'sqliteConnection'}),
      queryService: this.getInstance({key: 'sqliteProductSaleQueryService'})
    });
  }

  _productSaleStatisticsUseCase() {
    return new ProductSaleStatistics({
      repository: this.getInstance({key: 'productSaleStatisticsRepository'}),
      clock: this.getInstance({key: 'systemClock'})
    });
  }

  _recordProductSales() {
    return new RecordProductSales({
      repository: this.getInstance({key: 'productSaleStatisticsRepository'}),
      domainEventBus: this.getInstance({key: 'domainEventBus'})
    });
  }

  /**
   *
   * @returns {ProductFactoryImpl}
   */
  _productFactory() {
    return new ProductFactoryImpl({ identity: this.getInstance({key: 'randomUUIDIdentity'}) });
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

  _disableProduct() {
    return new DisableProduct({
      repository: this.getInstance({key: 'productRepository'})
    });
  }

  _enableProduct() {
    return new EnableProduct({
      repository: this.getInstance({key: 'productRepository'}),
      domainEventBus: this.getInstance({key: 'domainEventBus'}),
      transaction: this.getInstance({key: 'transaction'})
    });
  }

  _productMapper() {
    return new SqlProductMapper({
      productFactory: this.getInstance({key: 'productFactory'}),
      categoryFactory: this.getInstance({key: 'categoryFactory'})
    });
  }

  _sqliteOrderQueryService() {
    return new SqliteOrderQueryService();
  }

  _orderRepository() {
    return new SqliteOrderRepository({
      connection: this.getInstance({key: 'sqliteConnection'}),
      objectMapper: this.getInstance({key: 'orderMapper'}),
      queryService: this.getInstance({key: 'sqliteOrderQueryService'})
    });
  }

  _orderMapper(){
    return new SqlOrderMapper();
  }

  _domainEventRepository() {
    return new SqliteDomainEventRepository({
      connection: this.getInstance({key: 'sqliteConnection'})
    });
  }

  _transaction() {
    return new SqliteTransaction({
      connection: this.getInstance({key: 'sqliteConnection'})
    });
  }

  _systemClock() {
    return new SystemClock();
  }

  _domainEventBus() {
    const connection = this.getInstance({key: 'sqliteConnection'});
    return new DomainEventBus({
      repository: this.getInstance({key: 'domainEventRepository'}),
      identity: this.getInstance({key: 'randomUUIDIdentity'}),
      clock: this.getInstance({key: 'systemClock'}),
      recordError: record,
      inTransaction: () => connection.database.isTransaction
    });
  }

  _domainEventDispatcher() {
    return new DomainEventDispatcher({
      domainEventBus: this.getInstance({key: 'domainEventBus'}),
      transaction: this.getInstance({key: 'transaction'})
    });
  }

  _createOrderUseCase() {
    return new CreateOrder({
      orderRepository: this.getInstance({key: 'orderRepository'}),
      productRepository: this.getInstance({key: 'productRepository'}),
      invoiceRepository: this.getInstance({key: 'invoiceRepository'}),
      invoiceSequence: this.getInstance({key: 'invoiceSequence'}),
      orderFactory: this.getInstance({key: 'orderFactory'}),
      identity: this.getInstance({key: 'randomUUIDIdentity'}),
      clock: this.getInstance({key: 'systemClock'}),
      domainEventBus: this.getInstance({key: 'domainEventBus'}),
      transaction: this.getInstance({key: 'transaction'}),
      domainEventDispatcher: this.getInstance({key: 'domainEventDispatcher'}),
      shopProfileRepository: this.getInstance({key: 'shopProfileRepository'})
    });
  }

  _orderFactory() {
    return new OrderFactoryImpl({
      identity: this.getInstance({key: 'randomUUIDIdentity'}),
      clock: this.getInstance({key: 'systemClock'})
    });
  }

  _shopProfileRepository() {
    return new SqliteShopProfileRepository({
      connection: this.getInstance({key: 'sqliteConnection'})
    });
  }

  _getShopProfile() {
    return new GetShopProfile({
      shopProfileRepository: this.getInstance({key: 'shopProfileRepository'})
    });
  }

  _updateShopProfile() {
    return new UpdateShopProfile({
      shopProfileRepository: this.getInstance({key: 'shopProfileRepository'})
    });
  }

  _sellPreferencesRepository() {
    return new SqliteSellPreferencesRepository({
      connection: this.getInstance({key: 'sqliteConnection'})
    });
  }

  _getSellPreferences() {
    return new GetSellPreferences({
      sellPreferencesRepository: this.getInstance({key: 'sellPreferencesRepository'})
    });
  }

  _updateSellPreferences() {
    return new UpdateSellPreferences({
      sellPreferencesRepository: this.getInstance({key: 'sellPreferencesRepository'})
    });
  }

  _appearancePreferencesRepository() {
    return new SqliteAppearancePreferencesRepository({
      connection: this.getInstance({key: 'sqliteConnection'})
    });
  }

  _getAppearancePreferences() {
    return new GetAppearancePreferences({
      appearancePreferencesRepository: this.getInstance({key: 'appearancePreferencesRepository'})
    });
  }

  _changeTheme() {
    return new ChangeTheme({
      appearancePreferencesRepository: this.getInstance({key: 'appearancePreferencesRepository'})
    });
  }

  _invoiceMapper() {
    return new SqlInvoiceMapper();
  }

  _invoiceRepository() {
    return new SqliteInvoiceRepository({
      connection: this.getInstance({key: 'sqliteConnection'}),
      invoiceMapper: this.getInstance({key: 'invoiceMapper'})
    });
  }

  _invoiceSequence() {
    return new SqliteInvoiceSequence({
      connection: this.getInstance({key: 'sqliteConnection'})
    });
  }

  _cancelInvoice() {
    return new CancelInvoice({
      invoiceRepository: this.getInstance({key: 'invoiceRepository'}),
      clock: this.getInstance({key: 'systemClock'}),
      domainEventBus: this.getInstance({key: 'domainEventBus'}),
      transaction: this.getInstance({key: 'transaction'}),
      domainEventDispatcher: this.getInstance({key: 'domainEventDispatcher'})
    });
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

  /**
   * @returns {FindProductImage}
   */
  _findProductImage() {
    return new FindProductImage({
      productImageSource: this.getInstance({key: 'productImageSource'}),
      readDataUrl: dataUrlForFile
    });
  }

  _pluginSource() {
    return new FolderPluginSource({directory: pluginDirectory()});
  }

  _pluginRepository() {
    return new SqlitePluginRepository({
      connection: this.getInstance({key: 'sqliteConnection'})
    });
  }

  _secretStore() {
    return new SafeStorageSecretStore({
      connection: this.getInstance({key: 'sqliteConnection'}),
      bridge: electronSecretBridge()
    });
  }

  _listPlugins() {
    return new ListPlugins({
      pluginSource: this.getInstance({key: 'pluginSource'}),
      pluginRepository: this.getInstance({key: 'pluginRepository'}),
      secretStore: this.getInstance({key: 'secretStore'})
    });
  }

  _savePlugin() {
    return new SavePlugin({
      pluginSource: this.getInstance({key: 'pluginSource'}),
      pluginRepository: this.getInstance({key: 'pluginRepository'}),
      secretStore: this.getInstance({key: 'secretStore'})
    });
  }

  _pluginHost() {
    return new PluginHost({
      pluginSource: this.getInstance({key: 'pluginSource'}),
      pluginRepository: this.getInstance({key: 'pluginRepository'}),
      domainEventBus: this.getInstance({key: 'domainEventBus'}),
      connection: this.getInstance({key: 'sqliteConnection'}),
      appVersion: process.env.OPENMARKET_VERSION || '0.0.0',
      loadPlugin,
      events: eventClasses(),
      recordError: record,
      secretStore: this.getInstance({key: 'secretStore'}),
      receiptSlots: this.getInstance({key: 'receiptSlots'})
    });
  }

}

const staticContainer = new Container({environment: env});

export default staticContainer;
