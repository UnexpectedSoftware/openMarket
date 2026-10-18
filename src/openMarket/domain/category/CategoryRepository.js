/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('./Category').default} Category */
/** @typedef {import('./CategorySummary').default} CategorySummary */

/**
 * Port for the category collection.
 * Adapters declare `@implements {CategoryRepository}`; they do not extend this class.
 * @interface
 */
export default class CategoryRepository {

  /**
   * @returns {Observable<Category[]>}
   */
  findAll() {
    throw new Error('CategoryRepository#findAll must be implemented');
  }

  /**
   * Every category with product totals and its most sold product.
   * @returns {Observable<CategorySummary[]>}
   */
  findAllWithStats() {
    throw new Error('CategoryRepository#findAllWithStats must be implemented');
  }

  /**
   * Emits the category, or completes empty when the id is unknown.
   * @param {{id: string}} query
   * @returns {Observable<Category>}
   */
  findById({ id }) {
    throw new Error('CategoryRepository#findById must be implemented');
  }

  /**
   * @param {{category: Category, imagePath?: string | null}} command
   * @returns {Observable<null>}
   */
  save({ category, imagePath }) {
    throw new Error('CategoryRepository#save must be implemented');
  }

  /**
   * @param {{id: string, name: string}} command
   * @returns {Observable<null>}
   */
  update({ id, name }) {
    throw new Error('CategoryRepository#update must be implemented');
  }

  /**
   * @param {{id: string, imagePath: string}} command absolute path of a file to copy
   * @returns {Observable<null>}
   */
  updateCategory({id, imagePath}) {
    throw new Error('CategoryRepository#updateCategory must be implemented');
  }

  /**
   * Drop the stored photo and leave the category on the default image.
   * @param {{id: string}} command
   * @returns {Observable<null>}
   */
  clearImage({id}) {
    throw new Error('CategoryRepository#clearImage must be implemented');
  }

  /**
   * Delete a category that has no products, and its stored image.
   * @param {{id: string}} command
   * @returns {Observable<null>}
   */
  remove({id}) {
    throw new Error('CategoryRepository#remove must be implemented');
  }
}
