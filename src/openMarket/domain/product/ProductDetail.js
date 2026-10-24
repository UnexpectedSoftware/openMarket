import ProductView from './ProductView';

/**
 * One product as stored, for the edit drawer. The list fields, plus the
 * description and the stored image name. It does not check sale rules:
 * a row already in the database was valid when it was saved.
 * The write aggregate is `Product`. The list row is `ProductView`.
 */
export default class ProductDetail {

  /**
   * @param {{barcode?: string, name?: string, description?: string | null, categoryId?: string | null, categoryName?: string | null, priceCents?: number, basePriceCents?: number, vat?: {kind?: string, percent?: number, cause?: string | null} | null, stock?: number | null, stockMin?: number | null, weighted?: boolean, status?: string | null, imageUrl?: string | null, imageName?: string | null}} [props]
   */
  constructor(props = {}) {
    const view = new ProductView(props);
    this.barcode = view.barcode;
    this.name = view.name;
    this.categoryId = view.categoryId;
    this.categoryName = view.categoryName;
    this.priceCents = view.priceCents;
    this.basePriceCents = view.basePriceCents;
    this.marginPercent = view.marginPercent;
    this.vat = view.vat;
    this.stock = view.stock;
    this.stockMin = view.stockMin;
    this.weighted = view.weighted;
    this.status = view.status;
    this.lowStock = view.lowStock;
    this.imageUrl = view.imageUrl;
    this.description = props.description == null ? '' : String(props.description);
    this.imageName = props.imageName == null || props.imageName === '' ? null : String(props.imageName);
    Object.freeze(this);
  }

}
