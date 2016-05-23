/**
 * @interface
 * */
export default class CategoryRepository {

    findAll(){
        throw new Error('CategoryRepository#category must be implemented');
    }

    save({category}){
        throw new Error('CategoryRepository#category must be implemented');
    }
}
