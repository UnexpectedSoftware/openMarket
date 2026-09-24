import Identity from '../../domain/Identity';
import { v4 as uuidv4 } from 'uuid';
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
