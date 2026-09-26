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
   * Emits `{progress, completed, total, percent}` after the count and after each lookup,
   * then `{productsUpdated, categoriesUpdated}`.
   * @returns {Observable<Object>}
   */
  execute() {
    return Rx.Observable.create(observer => {
      this._run(observer).then(
        () => observer.complete(),
        error => observer.error(error)
      );
    });
  }

  async _run(observer) {
    const summary = {productsUpdated: 0, categoriesUpdated: 0};
    const categories = await this._categoryRepository.findAll().toPromise();
    const categoryWork = (categories || []).filter(category => !category.imageName);
    const productTotal = Number(await this._productRepository.countWithoutImage().toPromise()) || 0;
    const total = categoryWork.length + productTotal;
    let completed = 0;
    const report = () => {
      if (total < 1) {
        return;
      }
      observer.next({
        progress: true,
        completed,
        total,
        percent: Math.min(100, Math.round((completed / total) * 100))
      });
    };
    report();

    for (let index = 0; index < categoryWork.length; index += 1) {
      const category = categoryWork[index];
      summary.categoriesUpdated += await this._store(
        this._categoryImageSource.findByName({name: category.name}),
        imagePath => this._categoryRepository.updateCategory({id: category.id, imagePath})
      );
      completed += 1;
      report();
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
        completed += 1;
        report();
      }
      if (products.length < PRODUCT_BATCH_SIZE) {
        break;
      }
      offset += PRODUCT_BATCH_SIZE;
    }
    observer.next(summary);
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
