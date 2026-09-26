import CategoryFactory from '../../domain/category/CategoryFactory';
import Category from '../../domain/category/Category';
/**
 * @class CategoryFactoryImpl
 * @implements CategoryFactory
 */
export default class CategoryFactoryImpl extends CategoryFactory {
    /**
     *
     * @param {UUIDIdentity} identity
     */
  constructor({ identity }) {
    super();
        /**
         * @type {UUIDIdentity}
         * @member CategoryFactoryImpl#identity
         */
    this._identity = identity;
  }

    /**
     *
     * @param {string} name
     * @param {?string} imageName
     * @returns {Category}
     */
  createWith({ name, imageName = null }) {
    return new Category({ id: this._identity.generate(), name, imageName });
  }

  createWithId({ id, name, imageName = null }) {
    return new Category({ id, name, imageName });
  }

}
