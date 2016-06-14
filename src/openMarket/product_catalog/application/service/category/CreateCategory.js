export default class CreateCategory {
    constructor({repository}){
        this.repository = repository;
    }

    createCategory({name,imageUrl}){
        return this.repository.save({name,imageUrl});
    }
}
