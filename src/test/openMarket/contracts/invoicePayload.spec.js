import {expect} from 'chai';
import fs from 'fs';
import path from 'path';
import Invoice from '../../../openMarket/domain/invoice/Invoice';
import InvoiceNumber from '../../../openMarket/domain/invoice/InvoiceNumber';
import InvoiceIssued from '../../../openMarket/domain/event/InvoiceIssued';
import InvoiceCancelled from '../../../openMarket/domain/event/InvoiceCancelled';
import Order from '../../../openMarket/domain/order/Order';
import Money from '../../../openMarket/domain/money/Money';
import Quantity from '../../../openMarket/domain/money/Quantity';
import VatRate from '../../../openMarket/domain/tax/VatRate';
import {cancelledPayload, issuedPayload} from '../../../openMarket/domain/invoice/invoicePayload';
import {hydrate} from '../../../openMarket/domain/event/registry';

const fixtures = path.join(__dirname, 'fixtures');
const issuedFixture = JSON.parse(fs.readFileSync(path.join(fixtures, 'InvoiceIssued.v1.json'), 'utf8'));
const cancelledFixture = JSON.parse(fs.readFileSync(path.join(fixtures, 'InvoiceCancelled.v1.json'), 'utf8'));

function sampleInvoice() {
  const order = Order.restore({
    id: issuedFixture.orderId,
    date: '15/10/2026 22:41:07',
    lines: [
      {
        barcode: '8410000000001',
        name: 'Leche',
        price: Money.ofCents(95),
        quantity: Quantity.ofMilli(2000),
        vatRate: VatRate.of({kind: 'S1', percent: 4})
      },
      {
        barcode: '2000000000002',
        name: 'Jamón (kg)',
        price: Money.ofCents(1850),
        quantity: Quantity.ofMilli(350),
        vatRate: VatRate.of({kind: 'S1', percent: 10})
      }
    ]
  });
  return Invoice.issue({
    id: issuedFixture.invoiceId,
    invoiceNumber: new InvoiceNumber({series: '2026', number: 42}),
    issuedAt: issuedFixture.issuedAt,
    issueDate: issuedFixture.issueDate,
    issuer: issuedFixture.issuer,
    type: 'F2',
    order
  });
}

function keysOf(value, found = new Set()) {
  if (Array.isArray(value)) {
    value.forEach(item => keysOf(item, found));
    return found;
  }
  if (value && typeof value === 'object') {
    Object.keys(value).forEach(key => {
      found.add(key);
      keysOf(value[key], found);
    });
  }
  return found;
}

function expectWholeCents(value, where) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => expectWholeCents(item, where + '[' + index + ']'));
    return;
  }
  if (!value || typeof value !== 'object') {
    return;
  }
  Object.keys(value).forEach(key => {
    if (/Cents$|Milli$/.test(key)) {
      expect(value[key], where + '.' + key).to.be.a('number');
      expect(Number.isInteger(value[key]), where + '.' + key).to.equal(true);
    }
    expect(value[key], where + '.' + key).to.not.equal(undefined);
    expectWholeCents(value[key], where + '.' + key);
  });
}

describe('invoice event payload v1', () => {
  it('matches the issued fixture and keeps every cent whole', () => {
    const payload = issuedPayload(sampleInvoice());

    expect(payload).to.deep.equal(issuedFixture);
    expectWholeCents(payload, 'issued');
    const gross = payload.vatBreakdown.reduce((sum, row) => sum + row.grossCents, 0);
    const quota = payload.vatBreakdown.reduce((sum, row) => sum + row.quotaCents, 0);
    expect(gross).to.equal(payload.totalCents);
    expect(quota).to.equal(payload.vatTotalCents);
  });

  it('matches the cancelled fixture', () => {
    const invoice = sampleInvoice();
    invoice.cancel({cancelledAt: cancelledFixture.cancelledAt});

    expect(cancelledPayload(invoice, {reason: null})).to.deep.equal(cancelledFixture);
  });

  it('round-trips through hydrate', () => {
    const invoice = sampleInvoice();
    invoice.cancel({cancelledAt: cancelledFixture.cancelledAt});
    const issued = new InvoiceIssued(issuedPayload(invoice));
    const cancelled = new InvoiceCancelled(cancelledPayload(invoice));
    const issuedAgain = hydrate('InvoiceIssued', JSON.parse(JSON.stringify(issued)));
    const cancelledAgain = hydrate('InvoiceCancelled', JSON.parse(JSON.stringify(cancelled)));

    expect(JSON.parse(JSON.stringify(issuedAgain))).to.deep.equal(issuedFixture);
    expect(JSON.parse(JSON.stringify(cancelledAgain))).to.deep.equal(cancelledFixture);
    expect(Object.isFrozen(issuedAgain.lines)).to.equal(true);
    expect(Object.isFrozen(issuedAgain.issuer)).to.equal(true);
  });

  it('maps a stored row without schemaVersion to version 0', () => {
    const legacy = {
      id: 'old-1',
      series: '2026',
      number: 1,
      invoiceNumber: '2026/000001',
      issuedAt: '2026-10-14T12:00:00.000Z',
      orderId: 'order-1',
      lines: [{barcode: '0001', name: 'Cola', price: 0.55, quantity: 1, amount: 0.55}],
      total: 0.55
    };
    const event = hydrate('InvoiceIssued', legacy);

    expect(event).to.be.instanceof(InvoiceIssued);
    expect(event.schemaVersion).to.equal(0);
    expect(event.id).to.equal('old-1');
    expect(event.invoiceId).to.equal(undefined);
    expect(InvoiceIssued.schemaVersion).to.equal(1);
  });

  it('names every fixture key in the plugin document', () => {
    const docs = fs.readFileSync(path.join(__dirname, '../../../../docs/plugins.md'), 'utf8');
    const missing = [...keysOf(issuedFixture), ...keysOf(cancelledFixture)]
      .filter(key => !docs.includes(key));

    expect(missing).to.deep.equal([]);
  });
});
