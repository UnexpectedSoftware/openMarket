import {expect} from 'chai';
import Product from '../../../../openMarket/domain/product/Product';
import ProductView from '../../../../openMarket/domain/product/ProductView';
import ProductRepository from '../../../../openMarket/domain/product/ProductRepository';
import ProductsQuery from '../../../../openMarket/domain/product/ProductsQuery';

describe('ProductView', () => {
  it('freezes a list row and does not build a Product', () => {
    const vat = {kind: 'S1', percent: 10, cause: null};
    const view = new ProductView({
      barcode: '0001',
      name: 'Manzana',
      categoryId: 'fruit',
      categoryName: 'Fruta',
      priceCents: 120,
      basePriceCents: 70,
      vat,
      stock: 4,
      stockMin: 4,
      weighted: 1,
      status: 'ENABLED',
      imageUrl: 'data:image/png;base64,aa'
    });
    vat.percent = 99;
    expect(view).to.not.be.instanceof(Product);
    expect(view.addStock).to.equal(undefined);
    expect(view.subtractStock).to.equal(undefined);
    expect(view.enable).to.equal(undefined);
    expect(view.price).to.equal(undefined);
    expect(Object.isFrozen(view)).to.equal(true);
    expect(Object.isFrozen(view.vat)).to.equal(true);
    expect(() => {
      view.priceCents = 1;
    }).to.throw(TypeError);
    expect(view.marginPercent).to.equal(42);
    expect(view.vat.percent).to.equal(10);
    expect(view.lowStock).to.equal(true);
    expect(view.weighted).to.equal(true);
    expect(view.imageUrl).to.equal('data:image/png;base64,aa');
  });

  it('sets low stock only when both stock and the minimum are present', () => {
    expect(low({stock: null, stockMin: 1})).to.equal(false);
    expect(low({stock: undefined, stockMin: 1})).to.equal(false);
    expect(low({stock: 1, stockMin: null})).to.equal(false);
    expect(low({stock: 1, stockMin: undefined})).to.equal(false);
    expect(low({stock: 1, stockMin: 1})).to.equal(true);
    expect(low({stock: 0, stockMin: 0})).to.equal(true);
    expect(low({stock: 0, stockMin: 1})).to.equal(true);
    expect(low({stock: 2, stockMin: 1})).to.equal(false);
  });

  it('leaves margin null for a zero price and keeps a null vat', () => {
    const view = new ProductView({
      barcode: '0',
      name: 'Free',
      priceCents: 0,
      basePriceCents: 10,
      vat: null,
      stock: 1,
      stockMin: 1,
      weighted: 0,
      imageUrl: null
    });
    expect(view.marginPercent).to.equal(null);
    expect(view.vat).to.equal(null);
    expect(view.weighted).to.equal(false);
    expect(view.imageUrl).to.equal(null);
    expect(view.lowStock).to.equal(true);
  });

  it('uses the leche margin from the mockup', () => {
    const view = new ProductView({priceCents: 185, basePriceCents: 115, stock: 5, stockMin: 1});
    expect(view.marginPercent).to.equal(38);
    expect(view.lowStock).to.equal(false);
  });
});

describe('ProductRepository.find', () => {
  it('requires an adapter', () => {
    const port = new ProductRepository();
    expect(() => port.find(new ProductsQuery({}))).to.throw('ProductRepository#find must be implemented');
  });
});

/**
 * @param {{stock: number | null | undefined, stockMin: number | null | undefined}} stock
 * @returns {boolean}
 */
function low(stock) {
  return new ProductView(stock).lowStock;
}
