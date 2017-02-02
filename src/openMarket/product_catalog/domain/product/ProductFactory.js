/**
 * @interface
 * */
export default class ProductFactory{

    /**
     *
     * @param {string} barcode
     * @param {string} name
     * @param {string} description
     * @param {number} price
     * @param {number} stock
     */
    createWith({barcode,name,description,price,stock}){
        throw new Error('ProductFactory#product must be implemented');
    }

    /**
     *
     * @param {string} barcode
     * @param {string} name
     * @param {string} description
     * @param {number} price
     * @param {number} stock
     * @param {string} imageUrl
     */
    createWithImage({barcode,name,description,price,stock,imageUrl}){
        throw new Error('ProductFactory#product must be implemented');
    }

    /**
     *
     * @param {Category} category
     * @param {string} barcode
     * @param {string} name
     * @param {string} description
     * @param {number} price
     * @param {number} stock
     */
    createWithCategory({category,barcode,name,description,price,stock}){
        throw new Error('ProductFactory#product must be implemented');
    }
}
