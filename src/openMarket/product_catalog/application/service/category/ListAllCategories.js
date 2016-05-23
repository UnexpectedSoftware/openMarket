export default class ListAllCategories {

    constructor({repository}) {
        this.repository = repository;
    }

    toObservable(){
        return this.repository.findAll();
    }
}
