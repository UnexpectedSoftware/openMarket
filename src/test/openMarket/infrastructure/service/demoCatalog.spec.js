import { expect } from 'chai';
import { buildCategories, buildProducts } from '../../../../openMarket/infrastructure/dev/demoCatalog';
import catalog from '../../../../openMarket/infrastructure/dev/catalog.json';

describe('Demo catalog', () => {
  const categories = buildCategories();
  const products = buildProducts(categories);

  it('builds a grocery catalogue with mixed VAT, weight, and stock', () => {
    expect(categories).to.have.length(25);
    expect(categories.map(category => category._name)).to.deep.equal(catalog.map(entry => entry.name));
    expect(new Set(categories.map(category => category._id)).size).to.equal(25);
    expect(products).to.have.length(100);
    const barcodes = products.map(product => product._barcode);
    expect(new Set(barcodes).size).to.equal(products.length);
    expect([...new Set(products.map(product => product._vatPercent))].sort((left, right) => left - right))
      .to.deep.equal([4, 10, 21]);
    expect(products.some(product => product._weighted)).to.equal(true);
    expect(products.some(product => product._weighted === false)).to.equal(true);
    expect(products.filter(product => product._status === 'DISABLED').length).to.be.above(0);
    expect(products.filter(product => product._status === 'ENABLED' && product._stock === 0).length).to.be.above(0);
    expect(products.filter(product =>
      product._status === 'ENABLED' && product._stock > 0 && product._stock < product._stockMin
    ).length).to.be.above(0);
    expect(products.filter(product => product._imageName).map(product => product._imageName))
      .to.have.length(6);
    expect(products.some(product => product._name.length > 40)).to.equal(true);
    products.forEach(product => {
      expect(categories.map(category => category._id)).to.include(product._categoryId);
      expect(product._name.trim()).to.not.equal('');
      expect(product._barcode).to.match(/^[0-9]{13}$/);
      expect(product._vatKind).to.equal('S1');
      expect(product._price).to.be.a('number');
      expect(product._basePrice).to.be.at.most(product._price);
      expect(product._stockMin).to.equal(5);
      if (product._imageName) {
        expect(product._imageName).to.equal(product._barcode + '.png');
      }
    });
  });

  it('repeats the same catalog', () => {
    expect(buildCategories()).to.deep.equal(categories);
    expect(buildProducts(categories)).to.deep.equal(products);
  });
});
