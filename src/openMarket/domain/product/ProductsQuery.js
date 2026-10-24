/**
 * Criteria for one page of products. A value passed to `ProductRepository.find`.
 * It describes what to read. It is not a port, and it does not check the range.
 */
export default class ProductsQuery {

  /**
   * @param {{text?: string | null, categoryId?: string | null, status?: string | null, weighted?: boolean | null, lowStock?: boolean, sort?: string | null, limit?: number, offset?: number, forSale?: boolean}} [props]
   */
  constructor({text, categoryId, status, weighted, lowStock, sort, limit, offset, forSale} = {}) {
    this.text = text || null;
    this.categoryId = categoryId || null;
    this.status = status || null;
    this.weighted = weighted == null ? null : !!weighted;
    this.lowStock = !!lowStock;
    this.sort = sort || 'name_asc';
    this.limit = limit;
    this.offset = offset || 0;
    this.forSale = !!forSale;
    Object.freeze(this);
  }

}
