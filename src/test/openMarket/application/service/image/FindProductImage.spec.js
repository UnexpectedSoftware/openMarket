import {expect} from 'chai';
import * as Rx from 'rxjs';
import FindProductImage from '../../../../../openMarket/application/service/image/FindProductImage';

describe('FindProductImage', () => {
  it('returns the file from the product image source', () => {
    const useCase = new FindProductImage({
      productImageSource: {
        findByBarcode({barcode}) {
          expect(barcode).to.equal('5449000131805');
          return Rx.Observable.of('/tmp/openfoodfacts-1.jpg');
        }
      }
    });
    return useCase.findByBarcode({barcode: '5449000131805'}).toPromise()
      .then(found => {
        expect(found).to.deep.equal({imagePath: '/tmp/openfoodfacts-1.jpg', imageUrl: null});
      });
  });

  it('previews the file when a reader is wired', () => {
    const useCase = new FindProductImage({
      productImageSource: {
        findByBarcode() {
          return Rx.Observable.of('/tmp/openfoodfacts-1.jpg');
        }
      },
      readDataUrl(filePath) {
        expect(filePath).to.equal('/tmp/openfoodfacts-1.jpg');
        return 'data:image/jpeg;base64,aa';
      }
    });
    return useCase.findByBarcode({barcode: '1'}).toPromise()
      .then(found => {
        expect(found.imageUrl).to.equal('data:image/jpeg;base64,aa');
        expect(found.imagePath).to.equal('/tmp/openfoodfacts-1.jpg');
      });
  });

  it('passes a miss through', () => {
    const useCase = new FindProductImage({
      productImageSource: {
        findByBarcode() {
          return Rx.Observable.of(null);
        }
      }
    });
    return useCase.findByBarcode({barcode: '12'}).toPromise()
      .then(imagePath => {
        expect(imagePath).to.equal(null);
      });
  });
});
