import ProductFilterFactory from './ProductFilterFactoryImpl';
import LocalStorageProductRepository from './LocalStorageProductRepository';
import ListAllProducts from '../../application/service/product/ListAllProducts';
import UUIDIdentity from '../service/UUIDIdentity';
import ProductFactory from './ProductFactoryImpl';
import FindProduct from '../../application/service/product/FindProduct';
import SequentialIdentity from '../service/SequentialIdentity';
import CreateOrUpdateProduct from '../../application/service/product/CreateOrUpdateProduct';
import AddStock from '../../application/service/product/AddStock';
import ProductMapper from "./ProductMapper";
import ProductStatistics from "../../application/service/product/ProductStatistics";
/**
 * @class ProductDependencyBuilder
 */
export default class ProductDependencyBuilder {

    /**
     *
     * @returns {ProductFilterFactoryImpl}
     */
  static buildProductFilterFactory() {
    return new ProductFilterFactory();
  }

    /**
     *
     * @returns {LocalStorageProductRepository}
     */
  static buildProductRepository() {
    return new LocalStorageProductRepository({
      productMapper: ProductDependencyBuilder.buildProductMapper()
    });
  }

    /**
     *
     * @returns {ListAllProducts}
     */
  static buildListAllProductsUseCase() {
    return new ListAllProducts({
      repository: ProductDependencyBuilder.buildProductRepository(),
      productFilterFactory: ProductDependencyBuilder.buildProductFilterFactory()
    });
  }

  static buildProductStatisticsUseCase(){
    return new ProductStatistics({
      repository: ProductDependencyBuilder.buildProductRepository()
    });
  }


    // TODO Refactor ProductFactory
    /**
     *
     * @returns {ProductFactoryImpl}
     */
  static buildProductFactory() {
    const identity = new UUIDIdentity();
    return new ProductFactory({ identity });
  }

  static buildProductFactoryTest() {
    const identity = new SequentialIdentity();
    return new ProductFactory({ identity });
  }

  static buildFindProductsUseCase() {
    return new FindProduct({
      repository: ProductDependencyBuilder.buildProductRepository()
    });
  }

  static buildCreateProduct() {
    return new CreateOrUpdateProduct({
      repository: ProductDependencyBuilder.buildProductRepository(),
      productFactory: ProductDependencyBuilder.buildProductFactory()
    });
  }

  static buildAddStockProduct() {
    return new AddStock({
      repository: ProductDependencyBuilder.buildProductRepository()
    });
  }

  static buildProductMapper() {
    return new ProductMapper({
      productFactory: ProductDependencyBuilder.buildProductFactory()
    });
  }

}
