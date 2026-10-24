import {expect} from 'chai';
import Product from '../../../../openMarket/domain/product/Product';
import ProductDetail from '../../../../openMarket/domain/product/ProductDetail';
import ProductView from '../../../../openMarket/domain/product/ProductView';

describe('ProductDetail', () => {
  const ham = {
    barcode: '0002',
    name: 'Ham',
    description: 'Sliced',
    categoryId: 'deli',
    categoryName: 'Deli',
    priceCents: 1850,
    basePriceCents: 1150,
    vat: {kind: 'S1', percent: 10, cause: null},
    stock: 5,
    stockMin: 1,
    weighted: true,
    status: 'ENABLED',
    imageUrl: 'data:image/png;base64,aa',
    imageName: 'ham.png'
  };

  it('freezes the stored row and does not build a Product', () => {
    const detail = new ProductDetail(ham);
    expect(detail).to.not.be.instanceof(Product);
    expect(detail).to.not.be.instanceof(ProductView);
    expect(Object.isFrozen(detail)).to.equal(true);
    expect(Object.isFrozen(detail.vat)).to.equal(true);
    expect(detail.barcode).to.equal('0002');
    expect(detail.name).to.equal('Ham');
    expect(detail.description).to.equal('Sliced');
    expect(detail.categoryId).to.equal('deli');
    expect(detail.categoryName).to.equal('Deli');
    expect(detail.priceCents).to.equal(1850);
    expect(detail.basePriceCents).to.equal(1150);
    expect(detail.marginPercent).to.equal(38);
    expect(detail.vat).to.deep.equal({kind: 'S1', percent: 10, cause: null});
    expect(detail.stock).to.equal(5);
    expect(detail.stockMin).to.equal(1);
    expect(detail.weighted).to.equal(true);
    expect(detail.status).to.equal('ENABLED');
    expect(detail.lowStock).to.equal(false);
    expect(detail.imageUrl).to.equal('data:image/png;base64,aa');
    expect(detail.imageName).to.equal('ham.png');
    expect(detail.addStock).to.equal(undefined);
  });

  it('treats a blank description and a missing image name as empty', () => {
    const detail = new ProductDetail({
      barcode: '0',
      name: 'Free',
      priceCents: 0,
      basePriceCents: 0,
      stock: null,
      stockMin: 1,
      description: null,
      imageName: ''
    });
    expect(detail.description).to.equal('');
    expect(detail.imageName).to.equal(null);
    expect(new ProductDetail({imageName: null}).imageName).to.equal(null);
    expect(new ProductDetail().imageName).to.equal(null);
    expect(new ProductDetail().description).to.equal('');
    expect(detail.marginPercent).to.equal(null);
    expect(detail.lowStock).to.equal(false);
    expect(detail.weighted).to.equal(false);
  });

  it('keeps a description of empty text and a real image name', () => {
    const detail = new ProductDetail({description: '', imageName: 'a.jpg'});
    expect(detail.description).to.equal('');
    expect(detail.imageName).to.equal('a.jpg');
    const numbered = new ProductDetail({description: 12, imageName: 7});
    expect(numbered.description).to.equal('12');
    expect(numbered.imageName).to.equal('7');
  });

  it('copies vat data so a later change to the input does not show through', () => {
    const vat = {kind: 'E', percent: 0, cause: 'E1'};
    const detail = new ProductDetail({vat, priceCents: 100, basePriceCents: 200});
    vat.cause = 'E2';
    expect(detail.vat.cause).to.equal('E1');
    expect(detail.marginPercent).to.equal(-100);
  });
});
