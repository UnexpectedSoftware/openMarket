export default class ListAllProducts{

    constructor({repository,productFilterFactory}) {
        this.repository = repository;
        this.productFilterFactory = productFilterFactory;
    }

    findAll({limit,offset}){
        return this.repository.findAll({
            productFilter: this.productFilterFactory.createWith({
                limit: limit,
                offset: offset
            })
        });
    }

    findAllByName({name,limit,offset}){
        return this.repository.findAllByName({
            name: name,
            limit: limit,
            offset: offset
        });
    }


}
