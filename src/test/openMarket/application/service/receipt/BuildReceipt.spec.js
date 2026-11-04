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
import {formatEuroCents} from '../../../../../openMarket/domain/money/formatEs';

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

function shop(profile) {
  return {
    find() {
      return Rx.Observable.of(profile);
    }
  };
}

function useCase(slots, recordError, sellPreferencesRepository, shopProfileRepository) {
  return new BuildReceipt({
    invoiceRepository: {
      findByOrderId() {
        return Rx.Observable.of(invoice());
      }
    },
    receiptSlots: slots,
    recordError,
    sellPreferencesRepository,
    shopProfileRepository
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
      const ticket = receipt.blocks.map(block => block.text).join('\n');
      expect(ticket).to.include('FACTURA SIMPLIFICADA');
      expect(ticket).to.include('Mayor 1');
      expect(ticket).to.include('28013 Madrid');
      expect(ticket).to.include('15/10/2026 22:41');
      expect(ticket).to.not.include('Date ');
      expect(ticket).to.include('4 %  base ' + formatEuroCents(183) + '  cuota ' + formatEuroCents(7));
      expect(ticket).to.include('TOTAL ' + formatEuroCents(190));
      expect(ticket).to.not.include('Total:');
      expect(ticket).to.include('Leche  2 x ' + formatEuroCents(95) + ' = ' + formatEuroCents(190));
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
    useCase(slots, null, preferences({headerText: 'Gracias', footerText: 'Hasta pronto'}), shop({
      tradeName: 'Ultramarinos Pérez',
      legalName: 'SL',
      nif: 'B12345674',
      street: 'Mayor 1',
      postalCode: '28013',
      city: 'Madrid',
      province: 'Madrid',
      country: 'ES',
      phone: '600111222'
    }))
      .preview({
        lines: [{name: 'Leche', quantity: 1, price: 1}],
        issuer: {tradeName: 'Ignored'}
      })
      .subscribe(receipt => {
        const texts = receipt.blocks.map(block => block.text);
        expect(texts[0]).to.equal('FISCAL');
        expect(texts[1]).to.equal('Gracias');
        expect(texts).to.include('Ultramarinos Pérez');
        expect(texts).to.include('Mayor 1');
        expect(texts).to.include('Tel. 600111222');
        expect(texts).to.not.include('Ignored');
        expect(texts[texts.indexOf('Hasta pronto')]).to.equal('Hasta pronto');
        expect(texts[texts.length - 1]).to.equal('FOOTER-SLOT');
        expect(texts.indexOf('Hasta pronto')).to.be.below(texts.length - 1);
        expect(JSON.stringify(seen.fiscal)).to.not.include('Gracias');
        expect(seen.fiscal).to.equal(null);
        expect(texts.join('\n')).to.not.include('Date ');
        done();
      }, done);
  });

  it('stamps a preview with the shop clock', done => {
    const receiptCase = new BuildReceipt({
      invoiceRepository: {findByOrderId: () => Rx.Observable.empty()},
      receiptSlots: new ReceiptSlots(),
      clock: {
        zonedNow: () => ({date: '2026-11-01', local: '2026-11-01T23:17:00+01:00'})
      }
    });
    receiptCase.preview({lines: [{name: 'Leche', quantity: 1, price: 1}]}).subscribe(receipt => {
      const texts = receipt.blocks.map(block => block.text);
      expect(texts).to.include('FACTURA SIMPLIFICADA');
      expect(texts).to.include('01/11/2026 23:17');
      expect(texts.join('\n')).to.not.include('Date ');
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

  it('prints the current phone on a saved ticket without storing it on the invoice', done => {
    const {slots, seen} = slotsWithMarkers();
    useCase(slots, null, null, shop({phone: '600111222'})).build({orderId: 'order-1'})
      .subscribe(receipt => {
        expect(receipt.blocks.map(block => block.text)).to.include('Tel. 600111222');
        expect(JSON.stringify(seen.fiscal)).to.not.include('600111222');
        expect(seen.fiscal.issuer.phone).to.equal(undefined);
        done();
      }, done);
  });

  it('prints the order payment on the ticket and keeps it off the invoice payload', done => {
    const {slots, seen} = slotsWithMarkers();
    const receiptCase = new BuildReceipt({
      invoiceRepository: {findByOrderId: () => Rx.Observable.of(invoice())},
      receiptSlots: slots,
      orderRepository: {
        find: () => Rx.Observable.of({
          payment: {method: 'cash', tenderedCents: 500, changeCents: 310}
        })
      }
    });
    receiptCase.build({orderId: 'order-1'}).subscribe(receipt => {
      const lines = receipt.blocks.map(block => block.text);
      expect(lines).to.include('Efectivo');
      expect(lines.join('\n')).to.include('Entregado ' + formatEuroCents(500));
      expect(lines.join('\n')).to.include('Cambio ' + formatEuroCents(310));
      expect(seen.fiscal.payment).to.equal(undefined);
      done();
    }, done);
  });

  it('shows the payment the sheet is about to charge', done => {
    const receiptCase = new BuildReceipt({
      invoiceRepository: {findByOrderId: () => Rx.Observable.empty()},
      receiptSlots: new ReceiptSlots()
    });
    receiptCase.preview({
      lines: [{name: 'Leche', quantity: 1, price: 1}],
      payment: {method: 'card', tenderedCents: 100, changeCents: 0},
      invoiceNumber: '2026/000042'
    }).subscribe(receipt => {
      const lines = receipt.blocks.map(block => block.text);
      expect(lines).to.include('2026/000042');
      expect(lines).to.include('Tarjeta');
      expect(lines.join('\n')).to.not.include('Entregado');
      done();
    }, done);
  });

  it('prints a weighed cart line in kilograms', done => {
    const receiptCase = new BuildReceipt({
      invoiceRepository: {findByOrderId: () => Rx.Observable.empty()},
      receiptSlots: new ReceiptSlots()
    });
    receiptCase.preview({
      lines: [{name: 'Jamón', quantity: 0.35, price: 18.5, weighted: true}]
    }).subscribe(receipt => {
      expect(receipt.blocks.map(block => block.text).join('\n')).to.include(
        '0,35 kg x ' + formatEuroCents(1850) + '/kg'
      );
      done();
    }, done);
  });
});
