/**
 * @interface
 * */
export default class CategoryFactory {

    createWith({name,imageUrl}){
        throw new Error('CategoryFactory#category must be implemented');
    }
    

}
