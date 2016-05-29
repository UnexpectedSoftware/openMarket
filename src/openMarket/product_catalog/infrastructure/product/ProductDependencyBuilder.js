import ProductFilterFactory from './ProductFilterFactoryImpl';
import LocalStorageProductRepository from './LocalStorageProductRepository';
import ListAllProducts from '../../application/service/product/ListAllProducts';
import UUIDIdentity from '../service/UUIDIdentity';
import ProductFactory from '../product/ProductFactoryImpl'

export default class ProductDependencyBuilder {

    static buildProductFilterFactory(){
        return new ProductFilterFactory();
    }

    static buildProductRepository(){
        return new LocalStorageProductRepository();
    }

    static buildListAllProductsUseCase(){
        return new ListAllProducts({
            repository: ProductDependencyBuilder.buildProductRepository(),
            productFilterFactory: ProductDependencyBuilder.buildProductFilterFactory()
        });
    }

    static buildProductFactory(){
        // TODO Refactory this
        let identity = new UUIDIdentity();
        return new ProductFactory({identity: identity});
    }
}
