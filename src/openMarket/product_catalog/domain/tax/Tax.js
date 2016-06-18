/**
 * @class Tax
 */
export default class Tax {
    /**
     * @constructs Tax
     * @param {string} name
     * @param {number} value
     * @param {boolean} defaultTax
     */
    constructor({name,value,defaultTax}){
        /**
         * @type {String}
         * @member Tax#name
         * */
        this.name = name;
        /**
         * @type {number}
         * @member Tax#value
         * */
        this.value = value;
        /**
         * @type {boolean}
         * @member Tax#defaultTax
         * */
        this.defaultTax = defaultTax;
    }
}
