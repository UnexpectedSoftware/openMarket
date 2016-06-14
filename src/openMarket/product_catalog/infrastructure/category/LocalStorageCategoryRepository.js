import CategoryRepository from "../../domain/category/CategoryRepository";
import RxLocalStorage from "../service/RxLocalStorage";

const localStorageKey = 'categories';

export default class LocalStorageCategoryRepository extends CategoryRepository {

    constructor({categoryFactory}){
        super();
        this.categoryFactory = categoryFactory;
    }

    findAll(){
        return RxLocalStorage.loadLocalStorage({localStorageKey: localStorageKey});
    }

    save({name,imageUrl}){
        let category = this.categoryFactory.createWith({
            name: name,
            imageUrl: imageUrl
        });

        return RxLocalStorage.loadLocalStorage({localStorageKey: localStorageKey})
            .map(categoryArray => {
                categoryArray.push(category);
                return categoryArray;
            })
            .flatMap(categoryArray => RxLocalStorage.saveLocalStorage({localStorageKey: localStorageKey, value:categoryArray}));


    }

    saveCollection({data}){
        return RxLocalStorage.saveLocalStorage({localStorageKey: localStorageKey, value:data});
    }

    update({id,name,imageUrl}){
        return RxLocalStorage.loadLocalStorage({localStorageKey: localStorageKey})
            .map(categoryArray => {
                let optionalIndex = categoryArray.findIndex((category,index,array) =>{
                    return (category.id == id);
                });
                if(optionalIndex != -1) {
                    categoryArray[optionalIndex].name = name;
                    categoryArray[optionalIndex].imageUrl = imageUrl;
                }else{
                    console.log("category not found!");
                }
                return categoryArray;
            })
            .flatMap(categoryArray => RxLocalStorage.saveLocalStorage({localStorageKey: localStorageKey, value:categoryArray}));
    }

}
