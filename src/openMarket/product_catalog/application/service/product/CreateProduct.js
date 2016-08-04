/**
 * @class CreateProduct
 */
export default class CreateProduct {
    constructor({repository,productFactory}){
        this.repository = repository;
        this.productFactory = productFactory;
    }

    create({barcode,name,description,price,stock,imageUrl,categoryId}){
        let product = this.productFactory.createWithImage({
            barcode,
            name,
            description,
            price,
            stock,
            imageUrl,
            categoryId
        });
        return this.repository.save({product});
    }
}
