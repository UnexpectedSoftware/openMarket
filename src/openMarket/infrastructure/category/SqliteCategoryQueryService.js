import CategorySummary from '../../domain/category/CategorySummary';

/**
 * Maps a SUMMARIES_SQL row to a CategorySummary.
 */
export default class SqliteCategoryQueryService {

  summaryFrom(row) {
    return new CategorySummary({
      id: row.id,
      name: row.name,
      imageName: row.image_name,
      productCount: Number(row.product_count),
      stockTotal: Number(row.stock_total),
      basePriceTotal: Number(row.base_price_total),
      mostSold: row.most_sold_name == null ? null : {
        barcode: row.most_sold_barcode,
        name: row.most_sold_name,
        quantity: Number(row.most_sold_quantity)
      }
    });
  }

}
