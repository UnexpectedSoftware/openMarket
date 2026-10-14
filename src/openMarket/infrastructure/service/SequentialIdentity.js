/** @import Identity from '../../domain/Identity' */

/** @implements {Identity} */
export default class SequentialIdentity {

  constructor() {
    this.id = 0;
  }
    /**
     *
     * @returns {string}
     */
  generate() {
    return `Seq-${this.id++}`;
  }

}
