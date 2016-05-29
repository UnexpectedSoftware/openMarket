export default class ListAllCategories {

    constructor({repository}) {
        this.repository = repository;
    }

    findAll(){
        return this.repository.findAll();
    }
}
