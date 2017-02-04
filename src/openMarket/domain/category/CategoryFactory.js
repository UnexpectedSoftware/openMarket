/**
 * @interface
 * */
export default class CategoryFactory {
    /**
     *
     * @param {string} name
     * @param {string} imageUrl
     */
  createWith({ name, imageUrl }) {
    throw new Error('CategoryFactory#category must be implemented');
  }


}
