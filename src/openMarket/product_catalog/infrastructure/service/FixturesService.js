import CategoryFactory from './../category/CategoryFactory';
import Category from '../../domain/category/Category';

export default class FixturesService{

    constructor(){
        this.categoryRepository = CategoryFactory.buildCategoryRepository();
    }

    load(){
        let category1 = new Category({name: "Fruta", imageUrl:"http://nuevotiempo.org/mundoactual/files/2013/07/frutasverduras.jpg"});
        let category2 = new Category({name: "Conservas", imageUrl:"http://estaticos.mujeresreales.es/rcs/articles/2221/imagenes//CP_02-04-03_S491_opt.jpg"});
        let category3 = new Category({name: "Vinos", imageUrl:"http://www.escuelaespanolalicante.com/wp-content/uploads/2016/02/copasvinos.jpg"});

        this.categoryRepository.save({category: Array.from([category1,category2,category3])}).subscribe();
        
    }


}
