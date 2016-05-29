export default class Category{

    constructor({identity,name,imageUrl}){

        /**
         * @type {String}
         * */
        this.id = identity.generate();
        
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
