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
     * @returns {Category}
     */
  createWith({ name }) {
    return new Category({ id: this._identity.generate(), name });
  }

  createWithId({ id, name }) {
    return new Category({ id, name });
  }

}
