const defaultLimit = 10;
const defaultOffset = 0;
const defaultSorting = {name:"ASC"};

export default class ProductFilter {
    constructor({limit = defaultLimit, offset = defaultOffset, sort=defaultSorting} = {}){
        this._limit = limit;
        this._offset = offset;
        this.sorting = sort;
    }

    get limit(){
        return this._limit;
    }

    get offset(){
        return this._offset;
    }





}
