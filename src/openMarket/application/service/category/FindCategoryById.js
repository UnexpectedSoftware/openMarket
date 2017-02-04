/**
 * @class FindCategoryById
 */
export default class FindCategoryById {

    /**
     * @constructs FindCategoryById
     * @param {CategoryRepository} repository
     */
  constructor({ repository }) {
        /**
         * @type {CategoryRepository}
         * @member FindCategoryById#repository
         */
    this.repository = repository;
  }

    /**
     *
     * @param {string} id
     * @returns {Observable.<Category>}
     */
  findById({ id }) {
    return this.repository.findById({ id });
  }

}
