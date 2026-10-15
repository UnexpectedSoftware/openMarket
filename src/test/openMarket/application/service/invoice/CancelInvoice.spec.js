import {expect} from 'chai';
import * as Rx from 'rxjs';
import Invoice from '../../../../../openMarket/domain/invoice/Invoice';
import InvoiceNumber from '../../../../../openMarket/domain/invoice/InvoiceNumber';
import Order from '../../../../../openMarket/domain/order/Order';
import InvoiceCancelled from '../../../../../openMarket/domain/event/InvoiceCancelled';
import ErrorCode from '../../../../../openMarket/domain/error/ErrorCode';
import DomainEventBus from '../../../../../openMarket/domain/service/DomainEventBus';
import {memoryDomainEventRepository} from '../../../support/domainEventBus';
import CancelInvoice from '../../../../../openMarket/application/service/invoice/CancelInvoice';

const cancelledAt = '2026-10-14T15:00:00.000Z';

function issuedInvoice() {
  const order = new Order({
    id: 'order-1',
    lines: [{barcode: '0001', name: 'Cola', price: 0.55, quantity: 2}],
    date: '14/10/2026 12:00:00'
  }).place();
  return Invoice.issue({
    id: 'invoice-1',
    invoiceNumber: new InvoiceNumber({series: 'A', number: 1}),
    issuedAt: '2026-10-14T12:00:00.000Z',
    order
  });
}

function harness({invoice, failSave} = {}) {
  const repository = memoryDomainEventRepository();
  const state = {open: false};
  const bus = new DomainEventBus({
    repository,
    identity: {generate: () => 'event-1'},
    clock: {now: () => cancelledAt},
    inTransaction: () => state.open
  });
  const seen = [];
  bus.ofType(InvoiceCancelled).subscribe(event => seen.push(event));
  let saves = 0;
  let dispatched = 0;
  const useCase = new CancelInvoice({
    invoiceRepository: {
      findById() {
        return invoice ? Rx.Observable.of(invoice) : Rx.Observable.empty();
      },
      save({invoice: saved}) {
        saves += 1;
        return failSave ? Rx.Observable.throw(new Error('disk')) : Rx.Observable.of(saved);
      }
    },
    clock: {now: () => cancelledAt},
    domainEventBus: bus,
    transaction: {
      run(work) {
        state.open = true;
        return work().do(
          () => { state.open = false; },
          () => { state.open = false; }
        );
      }
    },
    domainEventDispatcher: {
      dispatch() {
        dispatched += 1;
      }
    }
  });
  return {useCase, repository, seen, saves: () => saves, dispatched: () => dispatched};
}

describe('CancelInvoice', () => {
  it('saves InvoiceCancelled with the issued snapshot', done => {
    const {useCase, repository, seen, dispatched} = harness({invoice: issuedInvoice()});
    useCase.cancelInvoice({id: 'invoice-1', cancelledAt}).subscribe(
      invoice => {
        expect(invoice.status).to.equal('CANCELLED');
        expect(invoice.cancelledAt).to.equal(cancelledAt);
        expect(invoice.invoiceNumber.formatted).to.equal('A/000001');
        expect(invoice.total.cents).to.equal(110);
        expect(invoice.lines[0].amount.cents).to.equal(110);
        expect(seen).to.have.lengthOf(1);
        expect(seen[0]).to.be.instanceof(InvoiceCancelled);
        expect(seen[0].schemaVersion).to.equal(1);
        expect(seen[0].invoiceId).to.equal('invoice-1');
        expect(seen[0].invoiceNumber).to.equal('A/000001');
        expect(seen[0].cancelledAt).to.equal(cancelledAt);
        expect(seen[0].issuedAt).to.equal('2026-10-14T12:00:00.000Z');
        expect(seen[0].totalCents).to.equal(110);
        expect(seen[0].reason).to.equal(null);
        expect(seen[0].lines).to.equal(undefined);
        expect(repository.events).to.have.lengthOf(1);
        expect(repository.events[0].type).to.equal('InvoiceCancelled');
        expect(repository.events[0].aggregateId).to.equal('invoice-1');
        expect(dispatched()).to.equal(1);
      },
      error => done(error),
      () => done()
    );
  });

  it('publishes nothing when the invoice does not exist', done => {
    const {useCase, seen, saves, dispatched} = harness();
    useCase.cancelInvoice({id: 'missing'}).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(error.code).to.equal(ErrorCode.INVOICE_NOT_FOUND);
        expect(seen).to.have.lengthOf(0);
        expect(saves()).to.equal(0);
        expect(dispatched()).to.equal(0);
        done();
      }
    );
  });

  it('publishes nothing when the invoice is already cancelled', done => {
    const invoice = issuedInvoice();
    invoice.cancel({cancelledAt: '2026-10-14T13:00:00.000Z'});
    const {useCase, seen, saves, repository, dispatched} = harness({invoice});
    useCase.cancelInvoice({id: 'invoice-1', cancelledAt}).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(error.code).to.equal(ErrorCode.INVOICE_ALREADY_CANCELLED);
        expect(invoice.cancelledAt).to.equal('2026-10-14T13:00:00.000Z');
        expect(seen).to.have.lengthOf(0);
        expect(saves()).to.equal(0);
        expect(repository.events).to.have.lengthOf(0);
        expect(dispatched()).to.equal(0);
        done();
      }
    );
  });

  it('drops the event when the cancellation cannot be saved', done => {
    const {useCase, seen, repository, dispatched} = harness({invoice: issuedInvoice(), failSave: true});
    useCase.cancelInvoice({id: 'invoice-1'}).subscribe(
      () => done(new Error('should fail')),
      () => {
        expect(seen).to.have.lengthOf(0);
        expect(repository.events).to.have.lengthOf(0);
        expect(dispatched()).to.equal(0);
        done();
      }
    );
  });
});
