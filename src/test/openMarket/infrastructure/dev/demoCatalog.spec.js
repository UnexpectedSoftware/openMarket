import { expect } from 'chai';
import { buildCategories, buildProducts } from '../../../../openMarket/infrastructure/dev/demoCatalog';
import catalog from '../../../../openMarket/infrastructure/dev/catalog.json';
import Money from '../../../../openMarket/domain/money/Money';
import Product from '../../../../openMarket/domain/product/Product';
import VatRate from '../../../../openMarket/domain/tax/VatRate';

describe('Demo catalog', () => {
  const categories = buildCategories();
  const products = buildProducts();

  it('builds a grocery catalogue with mixed VAT, weight, and stock', () => {
    expect(categories).to.deep.equal(catalog.map(entry => ({name: entry.name})));
    expect(products).to.have.length(100);
    expect(new Set(products.map(product => product.barcode)).size).to.equal(products.length);
    expect([...new Set(products.map(product => product.vatRate.percent))].sort((left, right) => left - right))
      .to.deep.equal([4, 10, 21]);
    expect(products.some(product => product.weighted)).to.equal(true);
    expect(products.some(product => product.weighted === false)).to.equal(true);
    expect(products.filter(product => !product.enabled)).to.have.length(4);
    expect(products.filter(product => product.enabled && product.closingStock === 0)).to.have.length(4);
    expect(products.filter(product =>
      product.enabled && product.closingStock > 0 && product.closingStock < product.stockMin
    )).to.have.length(8);
    expect(products.filter(product => product.image)).to.have.length(6);
    expect(products.some(product => product.name.length > 40)).to.equal(true);
    products.forEach(product => {
      expect(categories.map(category => category.name)).to.include(product.categoryName);
      expect(product.barcode).to.match(/^[0-9]{13}$/);
      expect(product.price).to.be.instanceOf(Money);
      expect(product.vatRate).to.be.instanceOf(VatRate);
      expect(product.basePrice.cents).to.be.at.most(product.price.cents);
      expect(product.stockMin).to.equal(5);
      expect(product.closingStock).to.be.at.least(0);
      expect(() => Product.create({
        barcode: product.barcode,
        name: product.name,
        price: product.price.toEuros()
      })).to.not.throw();
    });
  });

  it('repeats the same catalog', () => {
    expect(buildCategories()).to.deep.equal(categories);
    expect(buildProducts()).to.deep.equal(products);
  });
});
