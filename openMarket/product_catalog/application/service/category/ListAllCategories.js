export default class ListAllCategories {

    constructor({repository}) {
        this.repository = repository;
    }

    toObservable({filters}){
        return this.repository.findAll({filters: filters});
    }
}
