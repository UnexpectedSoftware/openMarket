export default class Category{

    constructor({name,imageUrl}){

        /**
         * @type {String}
         * */
        this.name = name;

        /**
         * @type {String}
         * */
        this.imageUrl = imageUrl;

        /**
         * @type {Array}
         * */
        this.products = [];
    }
}
