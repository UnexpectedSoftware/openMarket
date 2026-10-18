/** @typedef {import('../../domain/Identity').default} Identity */

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
