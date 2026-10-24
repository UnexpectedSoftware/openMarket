import {expect} from 'chai';
import Category from '../../../../openMarket/domain/category/Category';
import CategoryView from '../../../../openMarket/domain/category/CategoryView';
import CategoryRepository from '../../../../openMarket/domain/category/CategoryRepository';
import CategoriesQuery from '../../../../openMarket/domain/category/CategoriesQuery';

describe('CategoryView', () => {
  it('freezes a card and does not build a Category', () => {
    const sold = {barcode: '1001', name: 'Milk', quantity: 3};
    const view = new CategoryView({
      id: 'dairy',
      name: 'Dairy',
      imageUrl: 'data:image/png;base64,aa',
      productCount: 1,
      stockTotal: 4,
      basePriceCents: 150,
      mostSold: sold
    });
    sold.quantity = 9;
    expect(view).to.not.be.instanceof(Category);
    expect(view.imageName).to.equal(undefined);
    expect(Object.isFrozen(view)).to.equal(true);
    expect(Object.isFrozen(view.mostSold)).to.equal(true);
    expect(() => {
      view.basePriceCents = 1;
    }).to.throw(TypeError);
    expect(() => {
      view.mostSold.quantity = 1;
    }).to.throw(TypeError);
    expect(view.id).to.equal('dairy');
    expect(view.name).to.equal('Dairy');
    expect(view.imageUrl).to.equal('data:image/png;base64,aa');
    expect(view.productCount).to.equal(1);
    expect(view.stockTotal).to.equal(4);
    expect(view.basePriceCents).to.equal(150);
    expect(view.mostSold).to.deep.equal({barcode: '1001', name: 'Milk', quantity: 3});
    expect(view.mostSold).to.not.equal(sold);
  });

  it('accepts a missing most sold product and a missing image', () => {
    const view = new CategoryView({
      id: 'empty',
      name: 'Empty',
      imageUrl: null,
      productCount: 0,
      stockTotal: 0,
      basePriceCents: 0,
      mostSold: null
    });
    expect(view.mostSold).to.equal(null);
    expect(view.imageUrl).to.equal(null);
    expect(view.basePriceCents).to.equal(0);
    expect(view.productCount).to.equal(0);
    expect(Object.isFrozen(view)).to.equal(true);
  });

  it('treats an omitted image as no file', () => {
    const view = new CategoryView({});
    expect(view.imageUrl).to.equal(null);
    expect(view.mostSold).to.equal(null);
  });
});

describe('CategoryRepository.find', () => {
  it('requires an adapter', () => {
    const port = new CategoryRepository();
    expect(() => port.find(new CategoriesQuery({}))).to.throw('CategoryRepository#find must be implemented');
  });
});
