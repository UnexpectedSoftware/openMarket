import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/operator/defaultIfEmpty';
import 'rxjs/add/operator/mergeMap';
import ErrorCode from '../../../../../openMarket/domain/error/ErrorCode';
import AddStock from '../../../../../openMarket/application/service/product/AddStock';
import DisableProduct from '../../../../../openMarket/application/service/product/DisableProduct';
import EnableProduct from '../../../../../openMarket/application/service/product/EnableProduct';

function emptyRepository() {
  return {
    findByBarcode() {
      return Rx.Observable.empty();
    },
    save() {
      throw new Error('should not save');
    }
  };
}

function miss(use, done) {
  use.subscribe(
    () => done(new Error('expected a missing product')),
    error => {
      expect(error.code).to.equal(ErrorCode.PRODUCT_NOT_FOUND);
      expect(error.userMessage).to.equal('product not found');
      expect(error.context.barcode).to.equal('8412');
      done();
    }
  );
}

describe('A command that needs a product', () => {
  it('fails disable when the barcode is missing', (done) => {
    const useCase = new DisableProduct({repository: emptyRepository()});
    miss(useCase.disable({barcode: '8412'}), done);
  });

  it('fails enable when the barcode is missing', (done) => {
    const useCase = new EnableProduct({
      repository: emptyRepository(),
      domainEventBus: {publish() {}}
    });
    miss(useCase.enableForSale({barcode: '8412'}), done);
  });

  it('fails add stock when the barcode is missing', (done) => {
    const useCase = new AddStock({repository: emptyRepository()});
    miss(useCase.addStock({barcode: '8412', quantity: 1}), done);
  });
});
