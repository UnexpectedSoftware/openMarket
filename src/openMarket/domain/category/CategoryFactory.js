/**
 * @interface
 * */
export default class CategoryFactory {
    /**
     *
     * @param {string} name
     * @param {?string} imageName
     */
  createWith({ name, imageName }) {
    throw new Error('CategoryFactory#category must be implemented');
  }

  createWithId({ id, name, imageName }) {
    throw new Error('CategoryFactory#category must be implemented');
  }

}
