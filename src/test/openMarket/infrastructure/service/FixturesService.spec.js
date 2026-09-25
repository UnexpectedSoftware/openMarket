import { expect } from 'chai';
import SqliteConnection from '../../../../openMarket/infrastructure/service/SqliteConnection';
import FixturesService from '../../../../openMarket/infrastructure/dev/FixturesService';

const category = {_id: '1', _name: 'Fruit'};
const product = {
  _barcode: '1001',
  _name: 'Apple',
  _description: '',
  _price: 1.2,
  _basePrice: 0.4,
  _stock: 3,
  _stockMin: 5,
  _weighted: false,
  _categoryId: '1',
  _status: 'ENABLED'
};
const order = {
  _id: '1',
  _createdAt: '25/09/2026 12:00:00',
  _total: 1.2,
  _lines: [{barcode: '1001', name: 'Apple', price: 1.2, quantity: 1}]
};

function withDevelopment(run) {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    return run();
  } finally {
    process.env.NODE_ENV = previous;
  }
}

describe('FixturesService', () => {
  it('loads categories, products, and orders into an empty database once', () => {
    const database = new SqliteConnection({filename: ':memory:'}).database;
    let categoryName = 'Fruit';
    const service = new FixturesService({
      database,
      demoCatalog: {
        buildCategories: () => [{...category, _name: categoryName}],
        buildProducts: () => [product]
      },
      demoOrders: {
        buildDemoOrders: () => [order]
      }
    });

    withDevelopment(() => service.load());
    expect(database.prepare('SELECT name FROM category').get().name).to.equal('Fruit');
    expect(database.prepare('SELECT COUNT(*) AS total FROM product').get().total).to.equal(1);
    expect(database.prepare('SELECT COUNT(*) AS total FROM "order"').get().total).to.equal(1);
    expect(database.prepare('SELECT COUNT(*) AS total FROM line').get().total).to.equal(1);

    categoryName = 'Replaced';
    withDevelopment(() => service.load());
    expect(database.prepare('SELECT name FROM category').get().name).to.equal('Fruit');
    expect(database.prepare('SELECT COUNT(*) AS total FROM "order"').get().total).to.equal(1);
  });
});
