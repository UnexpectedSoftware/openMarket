import Category from '../../domain/category/Category';
/** @import CategoryFactory from '../../domain/category/CategoryFactory' */
/** @import Identity from '../../domain/Identity' */

/** @implements {CategoryFactory} */
export default class CategoryFactoryImpl {
    /**
     * @param {object} deps
     * @param {Identity} deps.identity
     */
  constructor({ identity }) {
        /**
         * @type {Identity}
         * @private
         */
    this._identity = identity;
  }

    /**
     * @param {{name: string, imageName?: string | null}} category
     * @returns {Category}
     */
  createWith({ name, imageName = null }) {
    return new Category({ id: this._identity.generate(), name, imageName });
  }

    /**
     * @param {{id: string, name: string, imageName?: string | null}} category
     * @returns {Category}
     */
  createWithId({ id, name, imageName = null }) {
    return new Category({ id, name, imageName });
  }

}
