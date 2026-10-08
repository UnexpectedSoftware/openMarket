import ProductStatus from '../../domain/product/ProductStatus';

function stockText(stock) {
  if (stock == null || Number.isNaN(Number(stock))) {
    return '';
  }
  return String(stock);
}

export default class CatalogPrinterService {

  constructor({printerConnection}) {
    this._connection = printerConnection;
  }

  /**
   * One page of a product list. The header is printed on the first page and the paper is cut on the last.
   * @returns {Observable<boolean>}
   */
  printBatch({printedAt, filters, products, header, cut}) {
    const selected = filters || {};
    return this._connection.print((printer) => {
      if (header) {
        printer.alignCenter();
        printer.println('SUPER COMPRIN');
        printer.println('Product list');
        printer.println(String(printedAt));
        printer.alignLeft();
        if (selected.query) {
          printer.println(`Search: ${selected.query}`);
        }
        if (selected.lowStock) {
          printer.println('Low stock');
        }
        if (selected.status === ProductStatus.ENABLED) {
          printer.println('Enabled');
        }
        if (selected.status === ProductStatus.DISABLED) {
          printer.println('Disabled');
        }
        if (selected.categoryName) {
          printer.println(`Category: ${selected.categoryName}`);
        }
        printer.drawLine();
        printer.tableCustom([
          {text: 'Name', align: 'LEFT', width: 0.75, bold: true},
          {text: 'Stock', align: 'RIGHT', width: 0.25, bold: true}
        ]);
      }
      (products || []).forEach(product => {
        printer.tableCustom([
          {text: product.name == null ? '' : String(product.name), align: 'LEFT', width: 0.75},
          {text: stockText(product.stock), align: 'RIGHT', width: 0.25}
        ]);
      });
      if (cut) {
        printer.cut();
      }
    });
  }
}
