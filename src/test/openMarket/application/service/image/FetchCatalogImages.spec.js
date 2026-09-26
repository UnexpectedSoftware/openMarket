import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import * as Rx from 'rxjs';
import FetchCatalogImages, {PRODUCT_BATCH_SIZE} from '../../../../../openMarket/application/service/image/FetchCatalogImages';

function of(value) {
  return Rx.Observable.of(value);
}

describe('FetchCatalogImages', () => {
  it('stores a returned file, skips photos that exist, and continues after a miss', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-fetch-'));
    const pan = path.join(directory, 'pan.jpg');
    const saved = path.join(directory, '8410000000003.jpg');
    fs.writeFileSync(pan, 'pan');
    fs.writeFileSync(saved, 'product');
    const categoryUpdates = [];
    const productUpdates = [];
    const lookedUp = [];
    const pages = [];
    const categories = {
      findAll: () => of([
        {id: '1', name: 'CHIPS', imageName: 'kept.png'},
        {id: '2', name: 'pan', imageName: null},
        {id: '3', name: 'Fruta', imageName: null}
      ]),
      updateCategory({id, imagePath}) {
        categoryUpdates.push({id, imagePath});
        return of(null);
      }
    };
    const products = {
      findPage({limit, offset}) {
        pages.push({limit, offset});
        return of([
          {barcode: '8410000000002', imageName: 'already.jpg'},
          {barcode: '62', imageName: null},
          {barcode: '8410000000003', imageName: null},
          {barcode: '8410000000001', imageName: null}
        ]);
      },
      updateProduct({barcode, imagePath}) {
        productUpdates.push({barcode, imagePath});
        return of(null);
      }
    };
    const useCase = new FetchCatalogImages({
      categoryRepository: categories,
      productRepository: products,
      categoryImageSource: {
        findByName({name}) {
          if (name === 'pan') {
            return of(pan);
          }
          return of(null);
        }
      },
      productImageSource: {
        findByBarcode({barcode}) {
          lookedUp.push(barcode);
          if (barcode === '8410000000001') {
            return of(null);
          }
          return of(saved);
        }
      },
      pauseMs: 0
    });

    const summary = await useCase.execute().toPromise();
    expect(summary).to.deep.equal({productsUpdated: 1, categoriesUpdated: 1});
    expect(categoryUpdates).to.deep.equal([{id: '2', imagePath: pan}]);
    expect(lookedUp).to.deep.equal(['8410000000003', '8410000000001']);
    expect(productUpdates).to.deep.equal([{barcode: '8410000000003', imagePath: saved}]);
    expect(pages).to.deep.equal([{limit: PRODUCT_BATCH_SIZE, offset: 0}]);
    expect(fs.existsSync(pan)).to.equal(false);
    expect(fs.existsSync(saved)).to.equal(false);
    fs.rmSync(directory, {recursive: true, force: true});
  });

  it('asks for the next page when a page is full and stops on a short page', async () => {
    const pages = [];
    const first = [];
    for (let index = 0; index < PRODUCT_BATCH_SIZE; index += 1) {
      first.push({barcode: String(8000000000000 + index), imageName: 'kept.jpg'});
    }
    const batches = [first, []];
    const products = {
      findPage({limit, offset}) {
        pages.push({limit, offset});
        return of(batches[pages.length - 1]);
      },
      updateProduct() {
        return of(null);
      }
    };
    const useCase = new FetchCatalogImages({
      categoryRepository: {findAll: () => of([])},
      productRepository: products,
      categoryImageSource: {findByName: () => of(null)},
      productImageSource: {
        findByBarcode() {
          throw new Error('a full page of existing photos does not need a lookup');
        }
      },
      pauseMs: 0
    });

    const summary = await useCase.execute().toPromise();
    expect(summary.productsUpdated).to.equal(0);
    expect(pages).to.deep.equal([
      {limit: 20, offset: 0},
      {limit: 20, offset: 20}
    ]);
  });

  it('counts a bad image update as a skip', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-fetch-'));
    const filePath = path.join(directory, 'bad.jpg');
    fs.writeFileSync(filePath, 'x');
    const useCase = new FetchCatalogImages({
      categoryRepository: {findAll: () => of([])},
      productRepository: {
        findPage: () => of([{barcode: '8410000000003', imageName: null}]),
        updateProduct: () => Rx.Observable.throw(new Error('not an image'))
      },
      categoryImageSource: {findByName: () => of(null)},
      productImageSource: {findByBarcode: () => of(filePath)},
      pauseMs: 0
    });
    const summary = await useCase.execute().toPromise();
    expect(summary.productsUpdated).to.equal(0);
    expect(fs.existsSync(filePath)).to.equal(false);
    fs.rmSync(directory, {recursive: true, force: true});
  });
});
