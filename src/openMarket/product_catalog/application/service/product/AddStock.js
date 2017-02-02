/**
 * @class AddStock
 */
export default class AddStock {

    /**
     * @constructs AddStock
     * @param {ProductRepository} repository
     */
    constructor({repository}){
        this.repository = repository;
    }

    addStock({barcode,quantity}){
        return this.repository.addStock({barcode,quantity});
    }
}