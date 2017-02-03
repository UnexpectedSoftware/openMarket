import CategoryFactory from '../../domain/category/CategoryFactory';
import Category from '../../domain/category/Category';
/**
 * @class CategoryFactoryImpl
 * @implements CategoryFactory
 */
export default class CategoryFactoryImpl extends CategoryFactory{
    /**
     *
     * @param {UUIDIdentity} identity
     */
    constructor({identity}){
        super();
        /**
         * @type {UUIDIdentity}
         * @member CategoryFactoryImpl#identity
         */
        this.identity = identity;
    }

    /**
     *
     * @param {string} name
     * @param {string} imageUrl
     * @returns {Category}
     */
    createWith({name,imageUrl}){
        return new Category({identity: this.identity, name: name, imageUrl:imageUrl});
    }

}
