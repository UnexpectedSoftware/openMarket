/**
 * Category class
 * @class Category
 */
export default class Category {

    /**
     * Category Constructor
     * @constructs Category
     * @param {UUIDIdentity} identity
     * @param {string} name
     * @param {string} imageUrl
     */
  constructor({ identity, name, imageUrl }) {
        /**
         * @type {string}
         * @member Category#id
         * */
    this.id = identity.generate();

        /**
         * @type {string}
         * @member Category#name
         * */
    this.name = name;

        /**
         * @type {string}
         * @member Category#imageUrl
         * */
    this.imageUrl = imageUrl;

        /**
         * @type {Array}
         * @member Category#products
         * */
    this.products = [];
  }
}
