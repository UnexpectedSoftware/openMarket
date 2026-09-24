import {expect} from 'chai';
import moment from 'moment';
import SqliteConnection from '../../../../openMarket/infrastructure/service/SqliteConnection';
import SqliteProductRepository from '../../../../openMarket/infrastructure/product/SqliteProductRepository';
import SqliteOrderRepository from '../../../../openMarket/infrastructure/order/SqliteOrderRepository';
import SqlProductMapper from '../../../../openMarket/infrastructure/product/SqlProductMapper';
import SqlOrderMapper from '../../../../openMarket/infrastructure/order/SqlOrderMapper';
import ProductFactoryImpl from '../../../../openMarket/infrastructure/product/ProductFactoryImpl';
import CategoryFactoryImpl from '../../../../openMarket/infrastructure/category/CategoryFactoryImpl';
import OrderFactoryImpl from '../../../../openMarket/infrastructure/order/OrderFactoryImpl';
import UUIDIdentity from '../../../../openMarket/infrastructure/service/UUIDIdentity';

const identity = new UUIDIdentity();
const categoryFactory = new CategoryFactoryImpl({identity});
const productFactory = new ProductFactoryImpl({identity});
const orderFactory = new OrderFactoryImpl({identity});

function repositories() {
  const connection = new SqliteConnection({filename: ':memory:'});
  const productMapper = new SqlProductMapper({
    productFactory,
    categoryFactory
  });
  return {
    connection,
    products: new SqliteProductRepository({connection, productMapper}),
    orders: new SqliteOrderRepository({
      connection,
      objectMapper: new SqlOrderMapper({orderFactory})
    })
  };
}

describe('SQLite repositories', () => {
  it('updates a product in place when the barcode already exists', (done) => {
    const {connection, products} = repositories();
    connection.database.prepare('INSERT INTO category (id, name) VALUES (?, ?)').run('1', 'fruta');
    const category = categoryFactory.createWithId({id: '1', name: 'fruta'});
    const original = productFactory.createWith({
      barcode: '0001',
      name: 'Manzanas',
      description: '',
      price: 1.3,
      basePrice: 0.3,
      stock: 10,
      stockMin: 1,
      weighted: false,
      category,
      status: 'ENABLED'
    });
    const renamed = productFactory.createWith({
      barcode: '0001',
      name: 'Manzanas fuji',
      description: '',
      price: 1.5,
      basePrice: 0.3,
      stock: 8,
      stockMin: 1,
      weighted: true,
      category,
      status: 'ENABLED'
    });

    products.save({product: original})
      .flatMap(() => products.save({product: renamed}))
      .flatMap(() => products.findByBarcode({barcode: '0001'}))
      .subscribe(
        product => {
          expect(product.name).to.equal('Manzanas fuji');
          expect(product.stock).to.equal(8);
          expect(Number(connection.database.prepare('SELECT count(*) AS total FROM product').get().total)).to.equal(1);
        },
        error => done(error),
        () => done()
      );
  });

  it('returns orders inside a date range with the display timestamp', (done) => {
    const {orders} = repositories();
    const inRange = orderFactory.createWith({
      id: '01',
      lines: [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 1}],
      date: '01/07/2017 17:53:04'
    });
    const outOfRange = orderFactory.createWith({
      id: '02',
      lines: [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 1}],
      date: '15/08/2017 17:53:04'
    });

    orders.save({order: inRange})
      .flatMap(() => orders.save({order: outOfRange}))
      .flatMap(() => orders.findAllByDates({
        limit: 10,
        offset: 0,
        startDate: moment('01/07/2017 00:00:00', 'DD/MM/YYYY HH:mm:ss'),
        endDate: moment('01/07/2017 23:59:59', 'DD/MM/YYYY HH:mm:ss')
      }))
      .subscribe(
        rows => {
          expect(rows).to.deep.equal([{
            id: '01',
            createdAt: '01/07/2017 17:53:04',
            total: 0.55
          }]);
        },
        error => done(error),
        () => done()
      );
  });

  it('rolls back the order when a line insert fails', (done) => {
    const {connection, orders} = repositories();
    connection.database.exec(
      "CREATE TRIGGER line_fail BEFORE INSERT ON line " +
      "WHEN new.barcode = 'fail' BEGIN SELECT RAISE(ABORT, 'line failed'); END"
    );
    const kept = orderFactory.createWith({
      id: 'kept',
      lines: [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 1}],
      date: '01/07/2017 17:53:04'
    });
    const rejected = orderFactory.createWith({
      id: 'rejected',
      lines: [{barcode: 'fail', name: 'Coca-Cola', price: 0.55, quantity: 1}],
      date: '02/07/2017 17:53:04'
    });

    orders.save({order: kept})
      .flatMap(() => orders.save({order: rejected}))
      .subscribe(
        () => done(new Error('the rejected order was saved')),
        () => {
          const ids = connection.database.prepare('SELECT id FROM "order" ORDER BY id').all().map(row => row.id);
          expect(ids).to.deep.equal(['kept']);
          const lines = Number(connection.database.prepare('SELECT count(*) AS total FROM line').get().total);
          expect(lines).to.equal(1);
          done();
        }
      );
  });
});
