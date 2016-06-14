export default class UpdateCategory {
    constructor({repository}){
        this.repository = repository;
    }

    updateCategory({id,name,imageUrl}){
        return this.repository.update({
            id: id,
            name: name,
            imageUrl: imageUrl
        });
    }
}
