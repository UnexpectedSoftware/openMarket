/**
 * @class FindProductById
 */
export default class FindProduct {

    /**
     * @constructs FindProduct
     * @param {ProductRepository} repository
     */
    constructor({repository}){
        /**
         * @type {ProductRepository}
         * @member FindProduct#repository
         */
        this.repository = repository;
    }

    findProductById({id}){
        return this.repository.findById({id});
    }

    findProductByBarcode({barcode}){
        return this.repository.findByBarcode({barcode});
    }

}
