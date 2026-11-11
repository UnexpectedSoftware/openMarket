import {expect} from 'chai';
import Product from '../../../../openMarket/domain/product/Product';
import InvalidProductError from '../../../../openMarket/domain/product/InvalidProductError';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';
import Category from '../../../../openMarket/domain/category/Category';

const fruit = new Category({id: '1', name: 'Fruit'});
const apple = {
  barcode: '1001',
  name: 'Apple',
  description: '',
  price: '1.20',
  basePrice: '0.40',
  stock: 3,
  stockMin: 5,
  weighted: false,
  category: fruit,
  status: 'ENABLED'
};

function refusal(params) {
  try {
    Product.create(params);
  } catch (error) {
    return error;
  }
  return null;
}

describe('Product', () => {
  it('creates a product with a barcode, a name, and a price', () => {
    const product = Product.create(apple);

    expect(product.barcode).to.equal('1001');
    expect(product.name).to.equal('Apple');
    expect(product.price.cents).to.equal(120);
    expect(Product.create({...apple, price: 0}).price.cents).to.equal(0);
  });

  it('refuses a blank barcode, a blank name, or a missing price', () => {
    const cases = [
      [{...apple, barcode: undefined}, 'barcode', 'Falta el código de barras', undefined],
      [{...apple, barcode: '  '}, 'barcode', 'Falta el código de barras', undefined],
      [{...apple, barcode: 1001}, 'barcode', 'Falta el código de barras', undefined],
      [{...apple, name: null}, 'name', 'Falta el nombre del producto', '1001'],
      [{...apple, name: ' '}, 'name', 'Falta el nombre del producto', '1001'],
      [{...apple, price: null}, 'price', 'Falta el precio', '1001'],
      [{...apple, price: undefined}, 'price', 'Falta el precio', '1001'],
      [{...apple, price: ''}, 'price', 'Falta el precio', '1001']
    ];

    cases.forEach(([params, field, userMessage, barcode]) => {
      const error = refusal(params);
      expect(error, field).to.be.instanceOf(InvalidProductError);
      expect(error.code).to.equal(ErrorCode.PRODUCT_INVALID);
      expect(error.message).to.equal('Product ' + field + ' is missing');
      expect(error.userMessage).to.equal(userMessage);
      expect(error.level).to.equal('warn');
      expect(error.context).to.deep.equal(barcode === undefined
        ? {field, operation: 'createProduct'}
        : {field, barcode, operation: 'createProduct'});
    });
    expect(refusal(undefined)).to.be.instanceOf(InvalidProductError);
  });

  it('restores a stored product without the creation checks', () => {
    const stored = Product.restore({...apple, name: null, price: null});

    expect(stored.name).to.equal(null);
    expect(stored.price.cents).to.equal(0);
  });
});
