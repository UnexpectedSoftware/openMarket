import * as Rx from 'rxjs';

export const CATALOG_PRINT_PAGE_SIZE = 20;

function cursorFrom(product) {
  const stock = product.stock;
  return {
    name: product.name == null ? '' : String(product.name),
    stock: stock == null || !Number.isFinite(Number(stock)) ? null : Number(stock),
    barcode: product.barcode
  };
}

/**
 * Prints every product that matches the catalog filters, one page at a time.
 * Emits progress after the count and after each page the printer accepts, then `{printed}`.
 */
export default class PrintProductCatalog {
  constructor({productRepository, catalogPrinter}) {
    this._productRepository = productRepository;
    this._catalogPrinter = catalogPrinter;
  }

  execute({query, lowStock, status, categoryId, sort, categoryName, printedAt}) {
    return Rx.Observable.create(observer => {
      const filters = {
        query: query || '',
        lowStock: !!lowStock,
        status: status || null,
        categoryId: categoryId || null,
        sort: sort || 'name_asc',
        categoryName: categoryName || '',
        printedAt
      };
      this._run(observer, filters).then(
        () => observer.complete(),
        error => observer.error(error)
      );
    });
  }

  async _run(observer, filters) {
    const total = Number(await this._productRepository.countCatalog(filters).toPromise()) || 0;
    if (total < 1) {
      observer.next({printed: 0});
      return;
    }
    let completed = 0;
    const report = () => {
      observer.next({
        progress: true,
        completed,
        total,
        percent: Math.min(100, Math.round((completed / total) * 100))
      });
    };
    report();
    let after = null;
    let first = true;
    try {
      while (completed < total) {
        const page = await this._productRepository.findCatalog({
          query: filters.query,
          lowStock: filters.lowStock,
          status: filters.status,
          categoryId: filters.categoryId,
          sort: filters.sort,
          after,
          limit: CATALOG_PRINT_PAGE_SIZE
        }).toPromise();
        const products = page && page.products ? page.products : [];
        if (products.length < 1) {
          break;
        }
        await this._catalogPrinter.printBatch({
          printedAt: filters.printedAt,
          filters,
          products,
          header: first,
          cut: !page.hasMore
        }).toPromise();
        first = false;
        completed += products.length;
        report();
        if (!page.hasMore) {
          break;
        }
        after = cursorFrom(products[products.length - 1]);
      }
    } catch (error) {
      const failure = new Error(error && error.message ? error.message : 'Could not print products');
      failure.printed = completed;
      failure.total = total;
      throw failure;
    }
    observer.next({printed: completed});
  }
}
