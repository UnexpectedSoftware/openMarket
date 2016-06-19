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
     * @param {string} categoryId
     */
    constructor({identity,barcode,name,description,price,stock,imageUrl,categoryId}){


        /**
         * @type {string}
         * @member Product#id
         * */
        this.id = identity.generate();

        /**
         * @type {string}
         * @member Product#barcode
         * */
        this.barcode = barcode;

        /**
         * @type {string}
         * @member Product#name
         * */
        this.name = name;

        /**
         * @type {string}
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
         * @type {string}
         * @member Product#imageUrl
         * */
        this.imageUrl = imageUrl;

        /**
         * @type {string}
         * @member Product#categoryId
         */
        this.categoryId = categoryId;

    }


}
