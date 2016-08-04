import ProductFilterFactory from './ProductFilterFactoryImpl';
import LocalStorageProductRepository from './LocalStorageProductRepository';
import ListAllProducts from '../../application/service/product/ListAllProducts';
import UUIDIdentity from '../service/UUIDIdentity';
import ProductFactory from '../product/ProductFactoryImpl'
import FindProduct from "../../application/service/product/FindProduct";
import SequentialIdentity from "../service/SequentialIdentity";
import CreateProduct from "../../application/service/product/CreateProduct";
/**
 * @class ProductDependencyBuilder
 */
export default class ProductDependencyBuilder {

    /**
     *
     * @returns {ProductFilterFactoryImpl}
     */
    static buildProductFilterFactory(){
        return new ProductFilterFactory();
    }

    /**
     *
     * @returns {LocalStorageProductRepository}
     */
    static buildProductRepository(){
        return new LocalStorageProductRepository();
    }

    /**
     *
     * @returns {ListAllProducts}
     */
    static buildListAllProductsUseCase(){
        return new ListAllProducts({
            repository: ProductDependencyBuilder.buildProductRepository(),
            productFilterFactory: ProductDependencyBuilder.buildProductFilterFactory()
        });
    }
    // TODO Refactor ProductFactory
    /**
     * 
     * @returns {ProductFactoryImpl}
     */
    static buildProductFactory(){
        let identity = new UUIDIdentity();
        return new ProductFactory({identity: identity});
    }

    static buildProductFactoryTest(){
        let identity = new SequentialIdentity();
        return new ProductFactory({identity: identity});
    }

    static buildFindProductsUseCase() {
        return new FindProduct({
            repository: ProductDependencyBuilder.buildProductRepository()
        });
    }

    static buildCreateProduct() {
        return new CreateProduct({
            repository: ProductDependencyBuilder.buildProductRepository(),
            productFactory: ProductDependencyBuilder.buildProductFactory()
        });
    }
}
