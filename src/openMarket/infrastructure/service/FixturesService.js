import CategoryDependencyBuilder from '../category/CategoryDependencyBuilder';
import ProductDependencyBuilder from '../product/ProductDependencyBuilder';
/**
 * @class FixturesService
 */
export default class FixturesService {

    /**
     * @constructs FixturesService
     */
  constructor() {
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
    this.productFactory = ProductDependencyBuilder.buildProductFactoryTest();
  }

  load() {

    const frutaCategory = this.categoryFactory.createWith({
      name: 'Fruta',
      imageUrl: 'http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg'
    });

    const categories = Array.from([
      frutaCategory,
      this.categoryFactory.createWith({
        name: 'Conservas',
        imageUrl: 'http://estaticos.mujeresreales.es/rcs/articles/2221/imagenes//CP_02-04-03_S491_opt.jpg'
      }),
      this.categoryFactory.createWith({
        name: 'Vinos',
        imageUrl: 'http://www.escuelaespanolalicante.com/wp-content/uploads/2016/02/copasvinos.jpg'
      }),
      this.categoryFactory.createWith({
        name: 'Fruta',
        imageUrl: 'http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg'
      }),
      this.categoryFactory.createWith({
        name: 'Conservas',
        imageUrl: 'http://estaticos.mujeresreales.es/rcs/articles/2221/imagenes//CP_02-04-03_S491_opt.jpg'
      }),
      this.categoryFactory.createWith({
        name: 'Vinos',
        imageUrl: 'http://www.escuelaespanolalicante.com/wp-content/uploads/2016/02/copasvinos.jpg'
      }),
      this.categoryFactory.createWith({
        name: 'Fruta',
        imageUrl: 'http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg'
      }),
      this.categoryFactory.createWith({
        name: 'Conservas',
        imageUrl: 'http://estaticos.mujeresreales.es/rcs/articles/2221/imagenes//CP_02-04-03_S491_opt.jpg'
      }),
      this.categoryFactory.createWith({
        name: 'Vinos',
        imageUrl: 'http://www.escuelaespanolalicante.com/wp-content/uploads/2016/02/copasvinos.jpg'
      }),
      this.categoryFactory.createWith({
        name: 'Fruta',
        imageUrl: 'http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg'
      }),
      this.categoryFactory.createWith({
        name: 'Conservas',
        imageUrl: 'http://estaticos.mujeresreales.es/rcs/articles/2221/imagenes//CP_02-04-03_S491_opt.jpg'
      }),
      this.categoryFactory.createWith({
        name: 'Vinos',
        imageUrl: 'http://www.escuelaespanolalicante.com/wp-content/uploads/2016/02/copasvinos.jpg'
      })
    ]);

    this.categoryRepository.saveCollection({ data: categories }).subscribe();

    const products = Array.from([
      this.productFactory.createWith({
        barcode: '0001',
        name: 'Coca-Cola',
        description: '',
        price: 0.55,
        basePrice: 0.30,
        stock: 100,
        stockMin: 10,
        categoryId: frutaCategory.id,
        imageUrl: "http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg"
      }),
      this.productFactory.createWith({
        barcode: '0002',
        name: 'Coca-Cola Zero',
        description: '',
        price: 0.60,
        basePrice: 0.30,
        stock: 1000,
        stockMin: 10,
        categoryId: frutaCategory.id,
        imageUrl: "http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg"
      }),
      this.productFactory.createWith({
        barcode: '0003',
        name: 'Coca-Cola Zero sin cafeina',
        description: '',
        price: 0.60,
        basePrice: 0.30,
        stock: 1000,
        stockMin: 10,
        categoryId: frutaCategory.id,
        imageUrl: "http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg"
      }),
      this.productFactory.createWith({
        barcode: '0004',
        name: 'Coca-Cola Zero zero',
        description: '',
        price: 0.60,
        basePrice: 0.30,
        stock: 1000,
        stockMin: 10,
        categoryId: frutaCategory.id,
        imageUrl: "http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg"
      }),
      this.productFactory.createWith({
        barcode: '0005',
        name: 'Coca-Cola Zero 42',
        description: '',
        price: 0.60,
        basePrice: 0.30,
        stock: 1000,
        stockMin: 10,
        categoryId: frutaCategory.id,
        imageUrl: "http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg"
      })
    ]);

    this.productRepository.saveCollection({ arrayProducts: products }).subscribe();
  }


}
