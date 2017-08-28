/**
 * Category class
 * @class Category
 */
export default class Category {

    /**
     * Category Constructor
     * @constructs Category
     * @param {string} id
     * @param {string} name
     */
  constructor({ id, name }) {
        /**
         * @type {string}
         * @member Category#id
         * */
    this._id = id;

        /**
         * @type {string}
         * @member Category#name
         * */
    this._name = name;

  }


  get name() {
    return this._name;
  }

  get id() {
    return this._id;
  }
}
