import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/operator/do';
import CreateOrUpdateProduct from '../../../../../openMarket/application/service/product/CreateOrUpdateProduct';
import ProductCreated from '../../../../../openMarket/domain/event/ProductCreated';

function bus() {
  const saved = [];
  return {
    saved,
    raised: 0,
    discarded: 0,
    save(event) {
      saved.push(event);
    },
    raise() {
      this.raised += 1;
    },
    discard() {
      this.discarded += 1;
    }
  };
}

function useCase({existing, category, product, save}) {
  const events = bus();
  const stored = [];
  return {
    events,
    stored,
    useCase: new CreateOrUpdateProduct({
      productRepository: {
        findByBarcode() {
          return existing ? Rx.Observable.of(existing) : Rx.Observable.empty();
        },
        save(command) {
          stored.push(command.product);
          return save ? save() : Rx.Observable.of(null);
        }
      },
      productFactory: {
        createWith() {
          return product;
        }
      },
      categoryRepository: {
        findById() {
          return category ? Rx.Observable.of(category) : Rx.Observable.empty();
        }
      },
      domainEventBus: events,
      transaction: {run(work) { return work(); }}
    })
  };
}

describe('CreateOrUpdateProduct', () => {
  const command = {barcode: '0001', name: 'Milk', categoryId: 'cat-1', price: 1};

  it('saves ProductCreated when the barcode is new', done => {
    const harness = useCase({category: {id: 'cat-1'}, product: {barcode: '0001', name: 'Milk'}});
    harness.useCase.createOrUpdate(command).subscribe(
      () => {
        expect(harness.stored).to.have.length(1);
        expect(harness.events.saved).to.have.length(1);
        expect(harness.events.saved[0]).to.be.instanceof(ProductCreated);
        expect(harness.events.saved[0].barcode).to.equal('0001');
        expect(harness.events.saved[0].name).to.equal('Milk');
        expect(harness.events.raised).to.equal(1);
        expect(harness.events.discarded).to.equal(0);
        done();
      },
      error => done(error)
    );
  });

  it('does not save ProductCreated when the barcode already exists', done => {
    const harness = useCase({
      existing: {barcode: '0001'},
      category: {id: 'cat-1'},
      product: {barcode: '0001', name: 'Milk'}
    });
    harness.useCase.createOrUpdate(command).subscribe(
      () => {
        expect(harness.stored).to.have.length(1);
        expect(harness.events.saved).to.deep.equal([]);
        expect(harness.events.raised).to.equal(1);
        done();
      },
      error => done(error)
    );
  });

  it('does not save an event when the category is missing', done => {
    const harness = useCase({product: {barcode: '0001', name: 'Milk'}});
    harness.useCase.createOrUpdate(command).subscribe(
      () => done(new Error('stored')),
      error => done(error),
      () => {
        expect(harness.stored).to.deep.equal([]);
        expect(harness.events.saved).to.deep.equal([]);
        expect(harness.events.raised).to.equal(0);
        done();
      }
    );
  });

  it('discards the queue when the product cannot be stored', done => {
    const harness = useCase({
      category: {id: 'cat-1'},
      product: {barcode: '0001', name: 'Milk'},
      save: () => Rx.Observable.throw(new Error('disk'))
    });
    harness.useCase.createOrUpdate(command).subscribe(
      () => done(new Error('stored')),
      () => {
        expect(harness.events.saved).to.deep.equal([]);
        expect(harness.events.discarded).to.equal(1);
        expect(harness.events.raised).to.equal(0);
        done();
      }
    );
  });
});
