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
     */
  save({ name }) {
    throw new Error('CategoryRepository#category must be implemented');
  }

    /**
     *
     * @param {string} id
     * @param {string} name
     */
  update({ id, name }) {
    throw new Error('CategoryRepository#category must be implemented');
  }
}
