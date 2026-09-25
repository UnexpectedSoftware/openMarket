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
     * @param {?string} imageName
     */
  constructor({ id, name, imageName = null }) {
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

        /**
         * Filename stored next to the database, or null
         * @type {?string}
         * @member Category#imageName
         * */
    this._imageName = imageName || null;

  }


  get name() {
    return this._name;
  }

  get id() {
    return this._id;
  }

  get imageName() {
    return this._imageName;
  }
}
