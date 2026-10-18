import {v4 as uuidv4} from 'uuid';
/** @typedef {import('./Identity').default} Identity */

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
