import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/operator/defaultIfEmpty';
import BuildReceipt from '../../../../../openMarket/application/service/receipt/BuildReceipt';
import SellPreferencesView from '../../../../../openMarket/domain/shop/SellPreferencesView';
import ReceiptSlots from '../../../../../openMarket/infrastructure/receipt/ReceiptSlots';
import Invoice from '../../../../../openMarket/domain/invoice/Invoice';
import InvoiceNumber from '../../../../../openMarket/domain/invoice/InvoiceNumber';
import Order from '../../../../../openMarket/domain/order/Order';
import Money from '../../../../../openMarket/domain/money/Money';
import Quantity from '../../../../../openMarket/domain/money/Quantity';
import VatRate from '../../../../../openMarket/domain/tax/VatRate';

function invoice() {
  const order = Order.restore({
    id: 'order-1',
    date: '15/10/2026 22:41:07',
    lines: [{
      barcode: '8410000000001',
      name: 'Leche',
      price: Money.ofCents(95),
      quantity: Quantity.ofMilli(2000),
      vatRate: VatRate.of({kind: 'S1', percent: 4})
    }]
  });
  return Invoice.issue({
    id: 'invoice-1',
    invoiceNumber: new InvoiceNumber({series: '2026', number: 1}),
    issuedAt: '2026-10-15T22:41:07+02:00',
    issueDate: '2026-10-15',
    issuer: {
      nif: 'B12345674',
      legalName: 'Ultramarinos Pérez SL',
      tradeName: 'Ultramarinos Pérez',
      address: {street: 'Mayor 1', postalCode: '28013', city: 'Madrid', province: 'Madrid', country: 'ES'}
    },
    order
  });
}

function preferences(fields) {
  return {
    find() {
      return Rx.Observable.of(new SellPreferencesView(fields));
    }
  };
}

function useCase(slots, recordError, sellPreferencesRepository) {
  return new BuildReceipt({
    invoiceRepository: {
      findByOrderId() {
        return Rx.Observable.of(invoice());
      }
    },
    receiptSlots: slots,
    recordError,
    sellPreferencesRepository
  });
}

function slotsWithMarkers() {
  const seen = {fiscal: null, footer: null};
  const slots = new ReceiptSlots();
  slots.register({
    pluginId: 'fiscal',
    slot: 'receipt.header.fiscal',
    render: payload => {
      seen.fiscal = payload;
      return [{type: 'text', text: 'FISCAL'}];
    }
  });
  slots.register({
    pluginId: 'fiscal',
    slot: 'receipt.footer',
    render: payload => {
      seen.footer = payload;
      return [{type: 'text', text: 'FOOTER-SLOT'}];
    }
  });
  return {slots, seen};
}

describe('BuildReceipt', () => {
  it('puts the fiscal slot first and the footer last', done => {
    const slots = new ReceiptSlots();
    slots.register({
      pluginId: 'fiscal',
      slot: 'receipt.header.fiscal',
      render: () => [{type: 'text', text: 'QR tributario:'}]
    });
    slots.register({
      pluginId: 'fiscal',
      slot: 'receipt.footer',
      render: () => [{type: 'text', text: 'VERI*FACTU'}]
    });
    useCase(slots).build({orderId: 'order-1'}).subscribe(receipt => {
      expect(receipt.blocks[0].text).to.equal('QR tributario:');
      expect(receipt.blocks[receipt.blocks.length - 1].text).to.equal('VERI*FACTU');
      expect(receipt.blocks.map(block => block.text).filter(Boolean)).to.include('2026/000001');
      expect(receipt.blocks.map(block => block.text).filter(Boolean)).to.include('NIF B12345674');
      expect(receipt.blocks.map(block => block.text).join('\n')).to.include('4 %  base 1.83  cuota 0.07');
      expect(receipt.blocks.map(block => block.text).join('\n')).to.include('Total: 1.90 €');
      expect(receipt.blocks.map(block => block.text).join('\n')).to.include('Leche  2 x 0.95 = 1.90');
      done();
    }, done);
  });

  it('wraps the shop blocks with header and footer outside the plugin slots', done => {
    const {slots, seen} = slotsWithMarkers();
    const rendered = [];
    const receiptCase = new BuildReceipt({
      invoiceRepository: {
        findByOrderId() {
          return Rx.Observable.of(invoice());
        }
      },
      receiptSlots: slots,
      sellPreferencesRepository: preferences({headerText: ' Gracias ', footerText: 'Hasta pronto'}),
      htmlReceiptRenderer: {
        render(document) {
          rendered.push(document);
          return '<p>ticket</p>';
        }
      }
    });
    receiptCase.build({orderId: 'order-1'}).subscribe(receipt => {
      const texts = receipt.blocks.map(block => block.text);
      const fiscal = texts.indexOf('FISCAL');
      const header = texts.indexOf('Gracias');
      const shop = texts.indexOf('Ultramarinos Pérez');
      const footer = texts.indexOf('Hasta pronto');
      const slot = texts.indexOf('FOOTER-SLOT');
      expect(fiscal).to.equal(0);
      expect(header).to.equal(1);
      expect(shop).to.be.above(header);
      expect(footer).to.be.above(shop);
      expect(slot).to.equal(texts.length - 1);
      expect(JSON.stringify(seen.fiscal)).to.not.include('Gracias');
      expect(JSON.stringify(seen.footer)).to.not.include('Hasta pronto');
      expect(seen.fiscal.headerText).to.equal(undefined);
      expect(rendered[0].paperWidthMm).to.equal(undefined);
      expect(rendered[0].blocks).to.equal(receipt.blocks);
      expect(receipt.html).to.equal('<p>ticket</p>');
      done();
    }, done);
  });

  it('adds no block for blank header and footer copy', done => {
    const {slots} = slotsWithMarkers();
    useCase(slots, null, preferences({headerText: null, footerText: '   '})).build({orderId: 'order-1'})
      .subscribe(receipt => {
        const texts = receipt.blocks.map(block => block.text);
        expect(texts[0]).to.equal('FISCAL');
        expect(texts[1]).to.equal('Ultramarinos Pérez');
        expect(texts[texts.length - 1]).to.equal('FOOTER-SLOT');
        expect(texts).to.not.include('');
        expect(texts).to.not.include('   ');
        done();
      }, done);
  });

  it('puts the same copy around a preview and keeps it off the slot payload', done => {
    const {slots, seen} = slotsWithMarkers();
    useCase(slots, null, preferences({headerText: 'Gracias', footerText: 'Hasta pronto'}))
      .preview({
        lines: [{name: 'Leche', quantity: 1, price: 1}],
        issuer: {tradeName: 'Ultramarinos Pérez', legalName: 'SL', nif: 'B12345674'}
      })
      .subscribe(receipt => {
        const texts = receipt.blocks.map(block => block.text);
        expect(texts[0]).to.equal('FISCAL');
        expect(texts[1]).to.equal('Gracias');
        expect(texts).to.include('Ultramarinos Pérez');
        expect(texts[texts.indexOf('Hasta pronto')]).to.equal('Hasta pronto');
        expect(texts[texts.length - 1]).to.equal('FOOTER-SLOT');
        expect(texts.indexOf('Hasta pronto')).to.be.below(texts.length - 1);
        expect(JSON.stringify(seen.fiscal)).to.not.include('Gracias');
        expect(seen.fiscal).to.equal(null);
        done();
      }, done);
  });

  it('drops a plugin renderer that throws and still builds the ticket', done => {
    const errors = [];
    const slots = new ReceiptSlots();
    slots.register({
      pluginId: 'fiscal',
      slot: 'receipt.header.fiscal',
      render: () => {
        throw new Error('plugin failed');
      }
    });
    useCase(slots, error => errors.push(error)).build({orderId: 'order-1'}).subscribe(receipt => {
      expect(errors).to.have.lengthOf(1);
      expect(receipt.blocks[0].text).to.equal('Ultramarinos Pérez');
      expect(receipt.blocks.map(block => block.text).join('\n')).to.include('2026/000001');
      done();
    }, done);
  });
});
