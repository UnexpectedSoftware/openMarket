import Identity from "../../domain/Identity";
/**
 * @class SequentialIdentity
 * @implements Identity
 */
export default class SequentialIdentity extends Identity {

    constructor(){
        super();
        this.id = 0;
    }
    /**
     *
     * @returns {string}
     */
    generate(){
        return "Seq-"+this.id++;
    }

}
