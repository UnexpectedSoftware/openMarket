import {expect} from 'chai';
import 'rxjs/add/operator/map';
import openMarket from '../openMarket/application/index';
import container from '../openMarket/infrastructure/dic/Container';
import {replaceSqliteData} from '../openMarket/infrastructure/service/sqliteSeed';

const database = container.getInstance({key: 'sqliteConnection'}).database;
const createOrder = openMarket.get('orders_create_use_case');
const invoiceRepository = container.getInstance({key: 'invoiceRepository'});

const product = {
  _id: 'Seq-0',
  _barcode: '0001',
  _name: 'Milk',
  _description: '',
  _price: 1.1,
  _basePrice: 1,
  _stock: 10,
  _stockMin: 1,
  _categoryId: '1',
  _status: 'ENABLED'
};

describe('VAT rates', () => {
  beforeEach(() => {
    replaceSqliteData(database, {products: [product]});
  });

  it('stores 21 % on a product that had no rate and keeps the invoice breakdown', done => {
    const stored = database.prepare('SELECT vat_percent, vat_kind, vat_cause FROM product WHERE barcode = ?').get('0001');
    expect(stored).to.deep.equal({vat_percent: 21, vat_kind: 'S1', vat_cause: null});

    createOrder.createOrder({lines: [{barcode: '0001', name: 'Milk', price: 1.1, quantity: 1}]})
      .flatMap(order => invoiceRepository.findById({id: database.prepare(
        'SELECT id FROM invoice WHERE order_id = ?'
      ).get(order.id).id}))
      .subscribe(
        invoice => {
          expect(invoice.lines[0].vatRate.code()).to.equal('S1:21');
          expect(invoice.breakdown).to.have.lengthOf(1);
          expect(invoice.breakdown[0].rate.percent).to.equal(21);
          expect(invoice.breakdown[0].gross.cents).to.equal(invoice.total.cents);
          expect(invoice.breakdown[0].base.cents + invoice.breakdown[0].quota.cents).to.equal(invoice.total.cents);
          const row = database.prepare(
            'SELECT kind, percent, base_cents, quota_cents, gross_cents FROM invoice_vat WHERE invoice_id = ?'
          ).get(invoice.id);
          expect(row.kind).to.equal('S1');
          expect(row.percent).to.equal(21);
          expect(row.gross_cents).to.equal(invoice.total.cents);
          database.prepare("UPDATE product SET vat_percent = 10 WHERE barcode = '0001'").run();
          invoiceRepository.findById({id: invoice.id}).subscribe(reloaded => {
            expect(reloaded.breakdown[0].rate.percent).to.equal(21);
            expect(reloaded.lines[0].vatRate.percent).to.equal(21);
            expect(() => database.prepare('UPDATE invoice_vat SET percent = 10').run()).to.throw(/cannot change/);
            done();
          }, done);
        },
        done
      );
  });
});
