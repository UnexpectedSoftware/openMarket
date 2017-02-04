import Identity from '../../domain/Identity';
import uuid from 'node-uuid';
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
    return uuid.v4();
  }

}
