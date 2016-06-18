import CategoryDependencyBuilder from '../category/CategoryDependencyBuilder';
import ProductDependencyBuilder from '../product/ProductDependencyBuilder';
/**
 * @class FixturesService
 */
export default class FixturesService{

    /**
     * @constructs FixturesService
     */
    constructor(){
        /**
         *
         * @type {LocalStorageCategoryRepository}
         */
        this.categoryRepository = CategoryDependencyBuilder.buildCategoryRepository();
        /**
         *
         * @type {CategoryFactoryImpl}
         */
        this.categoryFactory = CategoryDependencyBuilder.buildCategoryFactory();
        /**
         *
         * @type {LocalStorageProductRepository}
         */
        this.productRepository = ProductDependencyBuilder.buildProductRepository();
        /**
         * 
         * @type {ProductFactoryImpl}
         */
        this.productFactory = ProductDependencyBuilder.buildProductFactory();
    }

    load(){
        const categories = Array.from([
            this.categoryFactory.createWith({
                name: "Fruta",
                imageUrl:"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg"
            }),
            this.categoryFactory.createWith({
                name: "Conservas",
                imageUrl:"http://estaticos.mujeresreales.es/rcs/articles/2221/imagenes//CP_02-04-03_S491_opt.jpg"
            }),
            this.categoryFactory.createWith({
                name: "Vinos",
                imageUrl:"http://www.escuelaespanolalicante.com/wp-content/uploads/2016/02/copasvinos.jpg"
            }),
            this.categoryFactory.createWith({
                name: "Fruta",
                imageUrl:"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg"
            }),
            this.categoryFactory.createWith({
                name: "Conservas",
                imageUrl:"http://estaticos.mujeresreales.es/rcs/articles/2221/imagenes//CP_02-04-03_S491_opt.jpg"
            }),
            this.categoryFactory.createWith({
                name: "Vinos",
                imageUrl:"http://www.escuelaespanolalicante.com/wp-content/uploads/2016/02/copasvinos.jpg"
            }),
            this.categoryFactory.createWith({
                name: "Fruta",
                imageUrl:"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg"
            }),
            this.categoryFactory.createWith({
                name: "Conservas",
                imageUrl:"http://estaticos.mujeresreales.es/rcs/articles/2221/imagenes//CP_02-04-03_S491_opt.jpg"
            }),
            this.categoryFactory.createWith({
                name: "Vinos",
                imageUrl:"http://www.escuelaespanolalicante.com/wp-content/uploads/2016/02/copasvinos.jpg"
            }),
            this.categoryFactory.createWith({
                name: "Fruta",
                imageUrl:"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg"
            }),
            this.categoryFactory.createWith({
                name: "Conservas",
                imageUrl:"http://estaticos.mujeresreales.es/rcs/articles/2221/imagenes//CP_02-04-03_S491_opt.jpg"
            }),
            this.categoryFactory.createWith({
                name: "Vinos",
                imageUrl:"http://www.escuelaespanolalicante.com/wp-content/uploads/2016/02/copasvinos.jpg"
            })
        ]);

        this.categoryRepository.saveCollection({data: categories }).subscribe();

        const products = Array.from([
            this.productFactory.createWith({
                barcode: "0001",
                name: "Coca-Cola",
                description: "",
                price: 0.55,
                stock: 100
            }),
            this.productFactory.createWith({
                barcode: "0002",
                name: "Coca-Cola Zero",
                description: "",
                price: 0.60,
                stock: 1000
            })
        ]);

        this.productRepository.save({product: products}).subscribe();
        
    }


}
