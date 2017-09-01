import Identity from '../../domain/Identity';
import uuidv4 from 'uuid/v4';
/**
 * @class UUIDIdentity
 * @implements Identity
 */
export default class UUIDIdentity extends Identity {
    /**
     * @constructs UUIDIdentity
     */
  constructor() {
    super();
  }

    /**
     *
     * @returns {string}
     */
  generate() {
    return uuidv4();
  }

}
