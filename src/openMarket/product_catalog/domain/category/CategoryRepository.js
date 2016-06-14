/**
 * @interface
 * */
export default class CategoryRepository {

    findAll(){
        throw new Error('CategoryRepository#category must be implemented');
    }

    save({name,imageUrl}){
        throw new Error('CategoryRepository#category must be implemented');
    }

    saveCollection({data}){
        throw new Error('CategoryRepository#category must be implemented');
    }

    update({id,name,imageUrl}){
        throw new Error('CategoryRepository#category must be implemented');
    }
}
