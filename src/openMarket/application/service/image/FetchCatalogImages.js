import fs from 'fs';
import * as Rx from 'rxjs';
import {isProductBarcode} from '../../../domain/image/barcode';

export const PRODUCT_BATCH_SIZE = 20;

function removeFile(filePath) {
  if (!filePath) {
    return;
  }
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    // ImageStore already copied the file, so a missing temp path is expected.
  }
}

/**
 * Fills empty category and product photos from the two image sources.
 */
export default class FetchCatalogImages {
  constructor({categoryRepository, productRepository, categoryImageSource, productImageSource, pauseMs = 250}) {
    this._categoryRepository = categoryRepository;
    this._productRepository = productRepository;
    this._categoryImageSource = categoryImageSource;
    this._productImageSource = productImageSource;
    this._pauseMs = pauseMs;
  }

  /**
   * @returns {Observable<{productsUpdated: number, categoriesUpdated: number}>}
   */
  execute() {
    return Rx.Observable.defer(() => Rx.Observable.fromPromise(this._run()));
  }

  async _run() {
    const summary = {productsUpdated: 0, categoriesUpdated: 0};
    const categories = await this._categoryRepository.findAll().toPromise();
    const categoryRows = categories || [];
    for (let index = 0; index < categoryRows.length; index += 1) {
      const category = categoryRows[index];
      if (category.imageName) {
        continue;
      }
      summary.categoriesUpdated += await this._store(
        this._categoryImageSource.findByName({name: category.name}),
        imagePath => this._categoryRepository.updateCategory({id: category.id, imagePath})
      );
    }

    let offset = 0;
    while (true) {
      const page = await this._productRepository.findPage({
        limit: PRODUCT_BATCH_SIZE,
        offset
      }).toPromise();
      const products = page || [];
      for (let index = 0; index < products.length; index += 1) {
        const product = products[index];
        if (product.imageName || !isProductBarcode(product.barcode)) {
          continue;
        }
        summary.productsUpdated += await this._store(
          this._productImageSource.findByBarcode({barcode: product.barcode}),
          imagePath => this._productRepository.updateProduct({barcode: product.barcode, imagePath})
        );
      }
      if (products.length < PRODUCT_BATCH_SIZE) {
        break;
      }
      offset += PRODUCT_BATCH_SIZE;
    }
    return summary;
  }

  async _store(source, update) {
    const imagePath = await source.toPromise();
    await this._pause();
    if (!imagePath) {
      return 0;
    }
    try {
      await update(imagePath).toPromise();
      return 1;
    } catch (error) {
      return 0;
    } finally {
      removeFile(imagePath);
    }
  }

  _pause() {
    if (!this._pauseMs) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      setTimeout(resolve, this._pauseMs);
    });
  }
}
