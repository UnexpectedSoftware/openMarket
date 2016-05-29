import Identity from '../../domain/Identity';
import uuid from 'node-uuid';

export default class UUIDIdentity extends Identity {

    constructor(){
        super();
    }

    generate(){
        return uuid.v4();
    }

}
