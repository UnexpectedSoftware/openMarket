/**
 * @interface
 * */
export default class Identity {
  /**
   * @returns {string}
   */
  generate() {
    throw new Error('Identity#generate must be implemented');
  }
}
