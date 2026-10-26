import {expect} from 'chai';
import ProductWithLowStock from '../../../../openMarket/domain/event/ProductWithLowStock';

describe('ProductWithLowStock', () => {
  const fields = {barcode: '0001', name: 'Milk', stock: 3, stockMin: 4};

  it('stores the remaining stock and treats a missing weight flag as counted units', () => {
    const event = new ProductWithLowStock(fields);
    expect(event.barcode).to.equal('0001');
    expect(event.name).to.equal('Milk');
    expect(event.stock).to.equal(3);
    expect(event.stockMin).to.equal(4);
    expect(event.weighted).to.equal(false);
    expect(new ProductWithLowStock({...fields, weighted: 1}).weighted).to.equal(false);
  });

  it('records a weighed product', () => {
    expect(new ProductWithLowStock({...fields, stock: 0.5, weighted: true}).weighted).to.equal(true);
  });
});
