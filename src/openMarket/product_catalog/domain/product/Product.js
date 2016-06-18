/**
 * @class Product
 */
export default class Product {
    /**
     * @constructs Product
     * @param {UUIDIdentity} identity
     * @param {string} barcode
     * @param {string} name
     * @param {string} description
     * @param {number} price
     * @param {number} stock
     * @param {string} imageUrl
     */
    constructor({identity,barcode,name,description,price,stock,imageUrl}){


        /**
         * @type {String}
         * @member Product#id
         * */
        this.id = identity.generate();

        /**
         * @type {String}
         * @member Product#barcode
         * */
        this.barcode = barcode;

        /**
         * @type {String}
         * @member Product#name
         * */
        this.name = name;

        /**
         * @type {String}
         * @member Product@description
         * */
        this.description = description;

        /**
         * @type {number}
         * @member Product#price
         * */
        this.price = price;

        /**
         * @type {number}
         * @member Product#stock
         * */
        this.stock = stock;

        /**
         * @type {String}
         * @member Product#imageUrl
         * */
        this.imageUrl = imageUrl;
    }


}
