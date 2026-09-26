import { expect } from 'chai';
import { buildCategories, buildProducts } from '../../../../openMarket/infrastructure/dev/demoCatalog';
import catalog from '../../../../openMarket/infrastructure/dev/catalog.json';

describe('Demo catalog', () => {
  const categories = buildCategories();
  const products = buildProducts(categories);

  it('builds eight categories and five products in each', () => {
    expect(categories).to.have.length(8);
    const ids = categories.map(category => category._id);
    expect(new Set(ids).size).to.equal(8);
    expect(categories.map(category => category._name)).to.deep.equal(catalog.map(entry => entry.name));
    expect(products).to.have.length(40);
    const barcodes = catalog.reduce((all, entry) => all.concat(entry.products.map(product => product.barcode)), []);
    expect(products.map(product => product._barcode)).to.deep.equal(barcodes);
    products.forEach(product => {
      expect(ids).to.include(product._categoryId);
      expect(product._name.trim()).to.not.equal('');
      expect(product._barcode).to.match(/^[0-9]{8}$|^[0-9]{12,13}$/);
      expect(product._price).to.be.a('number');
    });
  });

  it('includes disabled products and products under their minimum stock', () => {
    expect(products.filter(product => product._status === 'DISABLED')).to.have.length(2);
    const lowStock = products.filter(product =>
      product._status === 'ENABLED' && product._stock < product._stockMin
    );
    expect(lowStock.length).to.be.above(0);
  });

  it('repeats the same catalog', () => {
    expect(buildCategories()).to.deep.equal(categories);
    expect(buildProducts(categories)).to.deep.equal(products);
  });
});
