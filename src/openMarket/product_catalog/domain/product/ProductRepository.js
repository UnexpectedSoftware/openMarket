/**
 * @interface
 * */
export default class ProductRepository{
    /**
     *
     * @param {ProductFilter} productFilter
     */
    findAll({productFilter}){
        throw new Error('ProductRepository#product must be implemented');
    }

    /**
     *
     * @param {string} name
     * @param {number} limit
     * @param {number} offset
     */
    findAllByName({name,limit,offset}){
        throw new Error('ProductRepository#product must be implemented');
    }

    /**
     *
     * @param {Product} product
     */
    save({product}){
        throw new Error('ProductRepository#product must be implemented');
    }

    /**
     *
     * @param {Array} arrayProducts
     */
    saveCollection({arrayProducts}){
        throw new Error('ProductRepository#product must be implemented');
    }

    /**
     *
     * @param {string} id
     */
    findById({id}){
        throw new Error('ProductRepository#product must be implemented');
    }

    /**
     *
     * @param {string} barcode
     */
    findByBarcode({barcode}){
        throw new Error('ProductRepository#product must be implemented');
    }
}
