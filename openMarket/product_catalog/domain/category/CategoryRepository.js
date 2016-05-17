/**
 * @interface
 * */
export default class CategoryRepository {

    findAllCategories({filters}){
        throw new Error('CategoryRepository#category must be implemented');
    }
}
