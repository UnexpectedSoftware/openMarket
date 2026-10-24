/**
 * Criteria for the category card grid. A value passed to `CategoryRepository.find`.
 * It describes what to read. It is not a port, and it does not check the range.
 * `sort` other than `name_asc` is still stored. This phase always reads in name order.
 * An omitted `limit` means every match.
 */
export default class CategoriesQuery {

  /**
   * @param {{text?: string | null, sort?: string | null, limit?: number, offset?: number}} [props]
   */
  constructor({text, sort, limit, offset} = {}) {
    this.text = text || null;
    this.sort = sort || 'name_asc';
    this.limit = limit;
    this.offset = offset || 0;
    Object.freeze(this);
  }

}
