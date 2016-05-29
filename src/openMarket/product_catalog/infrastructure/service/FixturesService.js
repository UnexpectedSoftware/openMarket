import CategoryDependencyBuilder from '../category/CategoryDependencyBuilder';
import ProductDependencyBuilder from '../product/ProductDependencyBuilder';

export default class FixturesService{

    constructor(){
        this.categoryRepository = CategoryDependencyBuilder.buildCategoryRepository();
        this.categoryFactory = CategoryDependencyBuilder.buildCategoryFactory();

        this.productRepository = ProductDependencyBuilder.buildProductRepository();
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

        this.categoryRepository.save({category: categories }).subscribe();

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
