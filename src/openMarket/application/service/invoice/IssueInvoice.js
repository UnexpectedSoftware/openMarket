import * as Rx from 'rxjs';
import 'rxjs/add/operator/defaultIfEmpty';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import Invoice from '../../../domain/invoice/Invoice';
import InvoiceNumber from '../../../domain/invoice/InvoiceNumber';
import InvalidInvoiceNumberError from '../../../domain/invoice/InvalidInvoiceNumberError';
import InvoiceOrderNotFoundError from '../../../domain/invoice/InvoiceOrderNotFoundError';
import InvoiceIssued from '../../../domain/event/InvoiceIssued';
import observableError from '../../../infrastructure/logging/observableError';
/** @import { Observable } from 'rxjs/Observable' */
/** @import InvoiceRepository from '../../../domain/invoice/InvoiceRepository' */
/** @import InvoiceSequence from '../../../domain/invoice/InvoiceSequence' */
/** @import OrderRepository from '../../../domain/order/OrderRepository' */
/** @import Order from '../../../domain/order/Order' */
/** @import Identity from '../../../domain/Identity' */
/** @import Clock from '../../../domain/Clock' */
/** @import DomainEventBus from '../../../domain/service/DomainEventBus' */
/** @import Transaction from '../../../domain/service/Transaction' */

/**
 * Issues an immutable invoice for a placed order and allocates its sequential number.
 * The number, the insert, and InvoiceIssued commit together.
 * The order's lines are copied. They are not checked again.
 */
export default class IssueInvoice {

  /**
   * @param {object} deps
   * @param {InvoiceRepository} deps.invoiceRepository
   * @param {InvoiceSequence} deps.invoiceSequence
   * @param {OrderRepository} deps.orderRepository
   * @param {Identity} deps.identity
   * @param {Clock} deps.clock
   * @param {DomainEventBus} deps.domainEventBus
   * @param {Transaction} deps.transaction
   * @param {{dispatch: () => void}} deps.domainEventDispatcher
   */
  constructor({
    invoiceRepository,
    invoiceSequence,
    orderRepository,
    identity,
    clock,
    domainEventBus,
    transaction,
    domainEventDispatcher
  }) {
    this._invoiceRepository = invoiceRepository;
    this._invoiceSequence = invoiceSequence;
    this._orderRepository = orderRepository;
    this._identity = identity;
    this._clock = clock;
    this._domainEventBus = domainEventBus;
    this._transaction = transaction;
    this._domainEventDispatcher = domainEventDispatcher;
  }

  /**
   * The series defaults to the year of the issue time.
   * @param {object} [command]
   * @param {string} [command.id]
   * @param {string} [command.orderId]
   * @param {string} [command.series]
   * @param {string} [command.issuedAt]
   * @returns {Observable<Invoice>}
   */
  issueInvoice({id, orderId, series, issuedAt} = {}) {
    const stamp = issuedAt == null || String(issuedAt).trim() === ''
      ? this._clock.now()
      : String(issuedAt);
    const chosenSeries = resolveSeries({series, issuedAt: stamp});
    if (!InvoiceNumber.isSeries(chosenSeries)) {
      return observableError(new InvalidInvoiceNumberError({series: chosenSeries}));
    }
    if (orderId == null || String(orderId).trim() === '') {
      return observableError(new InvoiceOrderNotFoundError({orderId}));
    }
    const referencedOrderId = String(orderId);
    return this._transaction.run(() => this._requireOrder({orderId: referencedOrderId})
      .flatMap(order => this._invoiceSequence.next({series: chosenSeries})
        .flatMap(invoiceNumber => this._store({
          id: id || this._identity.generate(),
          invoiceNumber,
          issuedAt: stamp,
          order
        }))))
      .do(
        () => {
          this._domainEventBus.raise();
          this._domainEventDispatcher.dispatch();
        },
        () => this._domainEventBus.discard()
      );
  }

  /**
   * @param {{orderId: string}} command
   * @returns {Observable<Order>}
   */
  _requireOrder({orderId}) {
    return this._orderRepository.findById({id: orderId})
      .defaultIfEmpty(null)
      .flatMap(order => {
        if (!order) {
          return observableError(new InvoiceOrderNotFoundError({orderId}));
        }
        return Rx.Observable.of(order);
      });
  }

  /**
   * @param {object} command
   * @param {string} command.id
   * @param {InvoiceNumber} command.invoiceNumber
   * @param {string} command.issuedAt
   * @param {Order} command.order
   * @returns {Observable<Invoice>}
   */
  _store({id, invoiceNumber, issuedAt, order}) {
    let invoice;
    try {
      invoice = Invoice.issue({id, invoiceNumber, issuedAt, order});
    } catch (error) {
      return observableError(error);
    }
    return this._invoiceRepository.save({invoice}).do(() => {
      this._domainEventBus.save(new InvoiceIssued(facts(invoice)));
    });
  }

}

/**
 * Year of an ISO-8601 stamp, or the series the caller asked for.
 * @param {{series: string | undefined, issuedAt: string}} params
 * @returns {string}
 */
function resolveSeries({series, issuedAt}) {
  if (series != null && String(series).trim() !== '') {
    return String(series).trim();
  }
  return String(issuedAt).slice(0, 4);
}

/**
 * Snapshot a subscriber can use without reading the invoice again.
 * @param {Invoice} invoice
 * @returns {{id: string, series: string, number: number, invoiceNumber: string, issuedAt: string, orderId: string | null, lines: Array<{barcode: string, name: string, price: number, quantity: number, amount: number}>, total: number}}
 */
function facts(invoice) {
  return {
    id: invoice.id,
    series: invoice.invoiceNumber.series,
    number: invoice.invoiceNumber.number,
    invoiceNumber: invoice.invoiceNumber.formatted,
    issuedAt: invoice.issuedAt,
    orderId: invoice.orderId,
    lines: invoice.lines,
    total: invoice.total
  };
}
