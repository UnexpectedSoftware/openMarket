import ProductFilterFactory from './ProductFilterFactoryImpl';
import LocalStorageProductRepository from './LocalStorageProductRepository';
import ListAllProducts from '../../application/service/product/ListAllProducts';
import UUIDIdentity from '../service/UUIDIdentity';
import ProductFactory from '../product/ProductFactoryImpl'
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

    /**
     * 
     * @returns {ProductFactoryImpl}
     */
    static buildProductFactory(){
        // TODO Refactory this
        let identity = new UUIDIdentity();
        return new ProductFactory({identity: identity});
    }
}
