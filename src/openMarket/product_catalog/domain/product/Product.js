export default class Product {

    constructor({identity,barcode,name,description,price,stock,imageUrl}){


        /**
         * @type {String}
         * */
        this.id = identity.generate();

        /**
         * @type {String}
         * */
        this.barcode = barcode;

        /**
         * @type {String}
         * */
        this.name = name;

        /**
         * @type {String}
         * */
        this.description = description;

        /**
         * @type {number}
         * */
        this.price = price;

        /**
         * @type {number}
         * */
        this.stock = stock;

        /**
         * @type {String}
         * */
        this.imageUrl = imageUrl;
    }


}
