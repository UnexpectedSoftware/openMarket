import ProductFilterFactory from '../../domain/product/ProductFilterFactory';
import ProductFilter from '../../domain/product/ProductFilter';
export default class ProductFilterFactoryImpl extends ProductFilterFactory{

    constructor(){
        super();
    }

    createWith({limit,offset}){
        return new ProductFilter({limit: limit, offset: offset});
    }

    createWithDefaults(){
        return new ProductFilter();
    }



}
