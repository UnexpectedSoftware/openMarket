import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/operator/defaultIfEmpty';
import BuildReceipt from '../../../../../openMarket/application/service/receipt/BuildReceipt';
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

function useCase(slots, recordError) {
  return new BuildReceipt({
    invoiceRepository: {
      findByOrderId() {
        return Rx.Observable.of(invoice());
      }
    },
    receiptSlots: slots,
    recordError
  });
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
