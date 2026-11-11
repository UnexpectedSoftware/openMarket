/**
 * A category was stored.
 */
export default class CategoryCreated {

  static get type() {
    return 'CategoryCreated';
  }

  /**
   * Stored even before a durable subscriber exists.
   * @returns {boolean}
   */
  static get durable() {
    return true;
  }

  /**
   * @param {object} params
   * @param {string} params.id
   * @param {string} params.name
   */
  constructor({id, name}) {
    this.id = id;
    this.name = name;
  }

}
