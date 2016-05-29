/**
 * @interface
 * */
export default class ProductFactory{

    createWith({barcode,name,description,price,stock}){
        throw new Error('ProductFactory#product must be implemented');
    }

    createWithImage({barcode,name,description,price,stock,imageUrl}){
        throw new Error('ProductFactory#product must be implemented');
    }

    createWithCategory({category,barcode,name,description,price,stock}){
        throw new Error('ProductFactory#product must be implemented');
    }
}
