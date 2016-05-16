export default class Tax {
    constructor({name,value,defaultTax}){
        /**
         * @type {String}
         * */
        this.name = name;
        /**
         * @type {number}
         * */
        this.value = value;
        /**
         * @type {boolean}
         * */
        this.defaultTax = defaultTax;
    }
}
