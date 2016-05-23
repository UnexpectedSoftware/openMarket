export default class Product {

    constructor({name,description,price,stock}){
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
    }


}
