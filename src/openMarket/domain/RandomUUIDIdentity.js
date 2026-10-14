import {v4 as uuidv4} from 'uuid';
/** @import Identity from './Identity' */

/**
 * Random id. The uuid package is the one implementation of Identity the domain uses.
 * @implements {Identity}
 */
export default class RandomUUIDIdentity {

  /**
   * @returns {string}
   */
  generate() {
    return uuidv4();
  }

}
