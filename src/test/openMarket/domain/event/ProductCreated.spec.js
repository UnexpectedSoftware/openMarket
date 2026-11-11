import {expect} from 'chai';
import ProductCreated from '../../../../openMarket/domain/event/ProductCreated';
import {hydrate} from '../../../../openMarket/domain/event/registry';

describe('ProductCreated', () => {
  it('stores the barcode and name and can be rebuilt from the bus', () => {
    expect(ProductCreated.type).to.equal('ProductCreated');
    expect(ProductCreated.durable).to.equal(true);
    const event = new ProductCreated({barcode: '0001', name: 'Milk'});
    expect(event.barcode).to.equal('0001');
    expect(event.name).to.equal('Milk');
    const rebuilt = hydrate('ProductCreated', {barcode: '0001', name: 'Milk'});
    expect(rebuilt).to.be.instanceof(ProductCreated);
    expect(rebuilt.barcode).to.equal('0001');
    expect(rebuilt.name).to.equal('Milk');
  });
});
