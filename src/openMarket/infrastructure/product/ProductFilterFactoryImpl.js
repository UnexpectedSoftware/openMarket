import ProductFilterFactory from '../../domain/product/ProductFilterFactory';
import ProductFilter from '../../domain/product/ProductFilter';
/**
 * @class ProductFilterFactoryImpl
 * @implements ProductFilterFactory
 */
export default class ProductFilterFactoryImpl extends ProductFilterFactory{

    /**
     * @constructs ProductFilterFactoryImpl
     */
    constructor(){
        super();
    }

    /**
     *
     * @param {number} limit
     * @param {number} offset
     * @returns {ProductFilter}
     */
    createWith({limit,offset}){
        return new ProductFilter({limit: limit, offset: offset});
    }

    /**
     *
     * @returns {ProductFilter}
     */
    createWithDefaults(){
        return new ProductFilter();
    }



}
