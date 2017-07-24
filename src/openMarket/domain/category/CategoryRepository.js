/**
 * @interface
 * */
export default class CategoryRepository {

  findAll() {
    throw new Error('CategoryRepository#category must be implemented');
  }

    /**
     *
     * @param {string} id
     */
  findById({ id }) {
    throw new Error('CategoryRepository#category must be implemented');
  }

    /**
     *
     * @param {string} name
     * @param {string} imageUrl
     */
  save({ name, imageUrl }) {
    throw new Error('CategoryRepository#category must be implemented');
  }

    /**
     *
     * @param {string} id
     * @param {string} name
     * @param {string} imageUrl
     */
  update({ id, name, imageUrl }) {
    throw new Error('CategoryRepository#category must be implemented');
  }
}
