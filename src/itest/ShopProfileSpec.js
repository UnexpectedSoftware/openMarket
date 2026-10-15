import {expect} from 'chai';
import 'rxjs/add/operator/mergeMap';
import openMarket from '../openMarket/application/index';
import container from '../openMarket/infrastructure/dic/Container';
import {replaceSqliteData} from '../openMarket/infrastructure/service/sqliteSeed';

const database = container.getInstance({key: 'sqliteConnection'}).database;
const updateShopProfile = openMarket.get('shop_update_profile_use_case');
const createOrder = openMarket.get('orders_create_use_case');

const product = {
  _id: 'Shop-0',
  _barcode: '0001',
  _name: 'Coca-Cola',
  _description: '',
  _price: 0.55,
  _basePrice: 0.3,
  _stock: 100,
  _stockMin: 10,
  _imageUrl: 'a',
  _categoryId: '1',
  _status: 'ENABLED'
};

describe('Shop profile on an invoice', () => {
  beforeEach(() => {
    replaceSqliteData(database, {products: [product]});
  });

  afterEach(() => {
    replaceSqliteData(database, {});
  });

  it('stores the issuer, the local date, and type F2, then refuses to rewrite the issuer', done => {
    updateShopProfile.update({
      nif: 'B12345674',
      legalName: 'Ultramarinos Pérez SL',
      tradeName: 'Ultramarinos Pérez',
      street: 'Mayor 1',
      postalCode: '28001',
      city: 'Madrid',
      province: 'Madrid',
      country: 'ES',
      invoicingEnabled: false
    }).flatMap(() => createOrder.createOrder({
      lines: [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 1}]
    })).flatMap(order => updateShopProfile.update({
      nif: '12345678Z',
      legalName: 'Changed Later',
      invoicingEnabled: true
    }).map(() => order)).subscribe(
      order => {
        const row = database.prepare(
          'SELECT issue_date AS issueDate, type, issuer_json AS issuerJson, issued_at AS issuedAt ' +
          'FROM invoice WHERE order_id = ?'
        ).get(order.id);
        expect(row.type).to.equal('F2');
        expect(row.issueDate).to.match(/^\d{4}-\d{2}-\d{2}$/);
        expect(row.issuedAt).to.match(/[+-]\d{2}:\d{2}$/);
        expect(JSON.parse(row.issuerJson).nif).to.equal('B12345674');
        expect(JSON.parse(row.issuerJson).legalName).to.equal('Ultramarinos Pérez SL');
        expect(() => database.prepare('UPDATE invoice SET issuer_json = ? WHERE order_id = ?').run('{}', order.id))
          .to.throw(/cannot change/);
      },
      error => done(error),
      () => done()
    );
  });
});
