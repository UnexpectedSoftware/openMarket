/**
 * @interface
 * */
export default class ProductRepository{

    findAll({productFilter}){
        throw new Error('ProductRepository#product must be implemented');
    }

    findAllByName({name,limit,offset}){
        throw new Error('ProductRepository#product must be implemented');
    }

    save({product}){
        throw new Error('ProductRepository#product must be implemented');
    }
}
