import ProductFactory from '../../domain/product/ProductFactory'
import Product from '../../domain/product/Product';

export default class ProductFactoryImpl extends ProductFactory{

    constructor({identity}){
        super();
        this.identity = identity;

    }

    createWith({barcode,name,description,price,stock}){
        return new Product({
            identity: this.identity,
            barcode: barcode,
            name: name,
            description: description,
            price: price,
            stock: stock
        })
    }
    //TODO Refactor this shit
    createWithImage({barcode,name,description,price,stock,imageUrl}){
        return new Product({
            identity: this.identity,
            barcode: barcode,
            name: name,
            description: description,
            price: price,
            stock: stock,
            imageUrl: imageUrl
        })
    }


    createWithCategory({category,barcode,name,description,price,stock}){
        throw new Error('ProductFactory#product must be implemented');
    }
}
