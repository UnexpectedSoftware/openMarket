/**
 * Category class
 * @class Category
 */
export default class Category {

    /**
     * @param {object} params
     * @param {string} params.id
     * @param {string} params.name
     * @param {string | null} [params.imageName]
     */
  constructor({ id, name, imageName = null }) {
        /**
         * @type {string}
         * @private
         */
    this._id = id;

        /**
         * @type {string}
         * @private
         */
    this._name = name;

        /**
         * Filename stored next to the database, or null
         * @type {string | null}
         * @private
         */
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
