import {expect} from 'chai';
import {lineQuedan, lowStockMessage, quedanText} from '../../../../openMarket/user_interface/low_stock/label';

describe('low stock copy', () => {
  it('says how many are left only when the row is low and the stock is a number', () => {
    expect(quedanText(null)).to.equal(null);
    expect(quedanText({lowStock: false, stock: 1})).to.equal(null);
    expect(quedanText({lowStock: true, stock: null})).to.equal(null);
    expect(quedanText({lowStock: true, stock: Number.NaN})).to.equal(null);
    expect(quedanText({lowStock: true, stock: 3, weighted: false})).to.equal('Quedan 3');
    expect(quedanText({lowStock: true, stock: 0, weighted: false})).to.equal('Quedan 0');
    expect(quedanText({lowStock: true, stock: 0.5, weighted: true})).to.equal('Quedan 0,5 kg');
  });

  it('uses a noted barcode when the line itself is not marked low', () => {
    const line = {kind: 'PRODUCT', barcode: '1', name: 'Milk', stock: 2, weighted: false, lowStock: false};
    expect(lineQuedan(line, [])).to.equal(null);
    expect(lineQuedan(line, ['1'])).to.equal('Quedan 2');
    expect(lineQuedan({kind: 'FREE', barcode: '', stock: 1, lowStock: true}, [])).to.equal(null);
    expect(lineQuedan({kind: 'PRODUCT', barcode: '1', lowStock: true}, ['1'])).to.equal(null);
  });

  it('writes the Spanish toast for counted and weighed stock', () => {
    expect(lowStockMessage({name: 'Milk', stock: 3, stockMin: 4})).to.equal(
      'Quedan 3 de Milk (mínimo 4).'
    );
    expect(lowStockMessage({name: 'Jamón', stock: 0.5, stockMin: 1, weighted: true})).to.equal(
      'Quedan 0,5 kg de Jamón (mínimo 1 kg).'
    );
    expect(lowStockMessage(null)).to.equal('Quedan — de  (mínimo —).');
  });
});
