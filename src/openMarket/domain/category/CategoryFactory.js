/**
 * @interface
 * */
export default class CategoryFactory {
    /**
     *
     * @param {string} name
     */
  createWith({ name }) {
    throw new Error('CategoryFactory#category must be implemented');
  }

  createWithId({ id, name }) {
    throw new Error('CategoryFactory#category must be implemented');
  }

}
