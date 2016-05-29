/**
 * @interface
 * */
export default class ProductFilterFactory{
    createWith({limit,offset}){
        throw new Error('ProductFilterFactory#ProductFilter must be implemented');
    }
    createWithDefaults(){
        throw new Error('ProductFilterFactory#ProductFilter must be implemented');
    }
}
