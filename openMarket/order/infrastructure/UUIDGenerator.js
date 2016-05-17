import IdGenerator from '../domain/order/IdGenerator';
import UUID from 'node-uuid';

export default class UUIDGenerator extends IdGenerator{

    constructor(){
        super();
    }

    generate(){
        return new UUID.v4();
    }

}
