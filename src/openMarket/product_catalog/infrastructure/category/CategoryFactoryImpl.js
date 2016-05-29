import CategoryFactory from '../../domain/category/CategoryFactory';
import Category from '../../domain/category/Category';

export default class CategoryFactoryImpl extends CategoryFactory{
    constructor({identity}){
        super();
        this.identity = identity;
    }

    createWith({name,imageUrl}){
        return new Category({identity: this.identity, name: name, imageUrl:imageUrl});
    }

}
