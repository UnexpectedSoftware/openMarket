import {expect} from 'chai';
import * as Rx from 'rxjs';
import InvoiceNumber from '../../../../../openMarket/domain/invoice/InvoiceNumber';
import InvoiceIssued from '../../../../../openMarket/domain/event/InvoiceIssued';
import ErrorCode from '../../../../../openMarket/domain/error/ErrorCode';
import Order from '../../../../../openMarket/domain/order/Order';
import DomainEventBus from '../../../../../openMarket/domain/service/DomainEventBus';
import {hydrate} from '../../../../../openMarket/domain/event/registry';
import {memoryDomainEventRepository} from '../../../support/domainEventBus';
import IssueInvoice from '../../../../../openMarket/application/service/invoice/IssueInvoice';

const lines = [{barcode: '0001', name: 'Cola', price: 0.55, quantity: 2}];
const issuedAt = '2026-10-14T12:00:00.000Z';

function placedOrder(orderLines = lines, id = 'order-1') {
  return new Order({
    id,
    lines: orderLines,
    date: '14/10/2026 12:00:00'
  }).place();
}

function harness({failSave, order, missingOrder} = {}) {
  const repository = memoryDomainEventRepository();
  const state = {open: false};
  const bus = new DomainEventBus({
    repository,
    identity: {generate: () => 'event-1'},
    clock: {now: () => issuedAt},
    inTransaction: () => state.open
  });
  const seen = [];
  bus.ofType(InvoiceIssued).subscribe(event => seen.push(event));
  const sequenceCalls = [];
  let allocated = 0;
  let dispatched = 0;
  const source = order === undefined && !missingOrder ? placedOrder() : order;
  const useCase = new IssueInvoice({
    invoiceRepository: {
      save({invoice}) {
        return failSave ? Rx.Observable.throw(new Error('disk')) : Rx.Observable.of(invoice);
      }
    },
    invoiceSequence: {
      next({series}) {
        sequenceCalls.push({series, open: state.open});
        allocated += 1;
        return Rx.Observable.of(new InvoiceNumber({series, number: allocated}));
      }
    },
    orderRepository: {
      findById() {
        if (missingOrder || source == null) {
          return Rx.Observable.empty();
        }
        return Rx.Observable.of(source);
      }
    },
    identity: {generate: () => 'invoice-1'},
    clock: {now: () => issuedAt},
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
  return {useCase, repository, seen, sequenceCalls, dispatched: () => dispatched, bus, state, order: source};
}

describe('IssueInvoice', () => {
  it('allocates the next number inside the transaction and saves InvoiceIssued', done => {
    const {useCase, repository, seen, sequenceCalls, dispatched} = harness();
    useCase.issueInvoice({orderId: 'order-1', series: 'A', issuedAt}).subscribe(
      invoice => {
        expect(invoice.id).to.equal('invoice-1');
        expect(invoice.invoiceNumber.formatted).to.equal('A/000001');
        expect(invoice.total).to.equal(1.1);
        expect(invoice.orderId).to.equal('order-1');
        expect(sequenceCalls).to.deep.equal([{series: 'A', open: true}]);
        expect(seen).to.have.lengthOf(1);
        expect(seen[0]).to.be.instanceof(InvoiceIssued);
        expect(seen[0].invoiceNumber).to.equal('A/000001');
        expect(seen[0].series).to.equal('A');
        expect(seen[0].number).to.equal(1);
        expect(seen[0].issuedAt).to.equal(issuedAt);
        expect(seen[0].orderId).to.equal('order-1');
        expect(seen[0].total).to.equal(1.1);
        expect(seen[0].lines).to.deep.equal([
          {barcode: '0001', name: 'Cola', price: 0.55, quantity: 2, amount: 1.1}
        ]);
        expect(seen[0].lines[0]).to.not.equal(lines[0]);
        expect(repository.events).to.have.lengthOf(1);
        expect(repository.events[0].type).to.equal('InvoiceIssued');
        expect(repository.events[0].aggregateId).to.equal('invoice-1');
        const stored = hydrate('InvoiceIssued', JSON.parse(repository.events[0].payload));
        expect(stored).to.be.instanceof(InvoiceIssued);
        expect(stored.invoiceNumber).to.equal('A/000001');
        expect(stored.lines[0].amount).to.equal(1.1);
        expect(dispatched()).to.equal(1);
      },
      error => done(error),
      () => done()
    );
  });

  it('uses the year of the issue time when no series is given', done => {
    const {useCase, sequenceCalls} = harness();
    useCase.issueInvoice({orderId: 'order-1'}).subscribe(
      invoice => {
        expect(sequenceCalls[0].series).to.equal('2026');
        expect(invoice.invoiceNumber.formatted).to.equal('2026/000001');
        expect(invoice.issuedAt).to.equal(issuedAt);
      },
      error => done(error),
      () => done()
    );
  });

  it('copies the order lines and keeps the order id', done => {
    const order = placedOrder();
    const {useCase} = harness({order});
    useCase.issueInvoice({orderId: 'order-1', series: 'A', issuedAt}).subscribe(
      invoice => {
        order.lines[0].quantity = 9;
        expect(invoice.orderId).to.equal('order-1');
        expect(invoice.lines[0].quantity).to.equal(2);
        expect(invoice.lines[0].amount).to.equal(1.1);
      },
      error => done(error),
      () => done()
    );
  });

  it('does not allocate a number when the order is missing', done => {
    const {useCase, sequenceCalls, seen, repository, dispatched} = harness({missingOrder: true});
    useCase.issueInvoice({orderId: 'missing', series: 'A'}).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(error.code).to.equal(ErrorCode.INVOICE_ORDER_NOT_FOUND);
        expect(sequenceCalls).to.have.lengthOf(0);
        expect(seen).to.have.lengthOf(0);
        expect(repository.events).to.have.lengthOf(0);
        expect(dispatched()).to.equal(0);
        done();
      }
    );
  });

  it('does not allocate a number when no order id is given', done => {
    const {useCase, sequenceCalls, dispatched} = harness();
    useCase.issueInvoice({series: 'A'}).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(error.code).to.equal(ErrorCode.INVOICE_ORDER_NOT_FOUND);
        expect(sequenceCalls).to.have.lengthOf(0);
        expect(dispatched()).to.equal(0);
        done();
      }
    );
  });

  it('publishes nothing when the invoice cannot be saved', done => {
    const {useCase, seen, repository, dispatched} = harness({failSave: true});
    useCase.issueInvoice({orderId: 'order-1', series: 'A'}).subscribe(
      () => done(new Error('should fail')),
      () => {
        expect(seen).to.have.lengthOf(0);
        expect(repository.events).to.have.lengthOf(0);
        expect(dispatched()).to.equal(0);
        done();
      }
    );
  });

  it('does not save InvoiceIssued when a synchronous subscriber throws', done => {
    const {useCase, bus, seen, repository, dispatched} = harness();
    bus.subscribeSync(InvoiceIssued, () => {
      throw new Error('sync failed');
    });
    useCase.issueInvoice({orderId: 'order-1', series: 'A'}).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(error.message).to.equal('sync failed');
        expect(seen).to.have.lengthOf(0);
        expect(repository.events).to.have.lengthOf(0);
        expect(dispatched()).to.equal(0);
        done();
      }
    );
  });

  it('returns the invoice when a live listener throws and keeps that listener', done => {
    const {useCase, bus, seen} = harness();
    let thrown = 0;
    bus.ofType(InvoiceIssued).subscribe(() => {
      thrown += 1;
      throw new Error('toast failed');
    });
    useCase.issueInvoice({orderId: 'order-1', series: 'A'}).subscribe(
      invoice => {
        expect(invoice.id).to.equal('invoice-1');
        expect(seen).to.have.lengthOf(1);
        expect(thrown).to.equal(1);
      },
      error => done(error),
      () => {
        useCase.issueInvoice({id: 'invoice-2', orderId: 'order-1', series: 'A'}).subscribe(
          () => {
            expect(seen).to.have.lengthOf(2);
            expect(thrown).to.equal(2);
          },
          error => done(error),
          () => done()
        );
      }
    );
  });
});
