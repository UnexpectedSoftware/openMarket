import 'rxjs/add/operator/defaultIfEmpty';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/mergeMap';
import InvoiceCancelled from '../../../domain/event/InvoiceCancelled';
import InvoiceNotFoundError from '../../../domain/invoice/InvoiceNotFoundError';
import observableError from '../../../infrastructure/logging/observableError';
/** @import { Observable } from 'rxjs/Observable' */
/** @import Invoice from '../../../domain/invoice/Invoice' */
/** @import InvoiceRepository from '../../../domain/invoice/InvoiceRepository' */
/** @import Clock from '../../../domain/Clock' */
/** @import DomainEventBus from '../../../domain/service/DomainEventBus' */
/** @import Transaction from '../../../domain/service/Transaction' */

/**
 * Cancels an issued invoice. The number and the lines stay.
 * InvoiceCancelled commits with the cancellation.
 */
export default class CancelInvoice {

  /**
   * @param {object} deps
   * @param {InvoiceRepository} deps.invoiceRepository
   * @param {Clock} deps.clock
   * @param {DomainEventBus} deps.domainEventBus
   * @param {Transaction} deps.transaction
   * @param {{dispatch: () => void}} deps.domainEventDispatcher
   */
  constructor({invoiceRepository, clock, domainEventBus, transaction, domainEventDispatcher}) {
    this._invoiceRepository = invoiceRepository;
    this._clock = clock;
    this._domainEventBus = domainEventBus;
    this._transaction = transaction;
    this._domainEventDispatcher = domainEventDispatcher;
  }

  /**
   * @param {object} command
   * @param {string} command.id
   * @param {string} [command.cancelledAt]
   * @returns {Observable<Invoice>}
   */
  cancelInvoice({id, cancelledAt}) {
    const invoiceId = id == null ? '' : String(id).trim();
    if (invoiceId === '') {
      return observableError(new InvoiceNotFoundError({id, operation: 'cancel'}));
    }
    const stamp = cancelledAt == null || String(cancelledAt).trim() === ''
      ? this._clock.now()
      : String(cancelledAt);
    return this._transaction.run(() => this._invoiceRepository.findById({id: invoiceId})
      .defaultIfEmpty(null)
      .flatMap(invoice => {
        if (!invoice) {
          return observableError(new InvoiceNotFoundError({id: invoiceId, operation: 'cancel'}));
        }
        try {
          invoice.cancel({cancelledAt: stamp});
        } catch (error) {
          return observableError(error);
        }
        return this._invoiceRepository.save({invoice}).do(() => {
          this._domainEventBus.save(new InvoiceCancelled({
            id: invoice.id,
            series: invoice.invoiceNumber.series,
            number: invoice.invoiceNumber.number,
            invoiceNumber: invoice.invoiceNumber.formatted,
            issuedAt: invoice.issuedAt,
            cancelledAt: invoice.cancelledAt,
            orderId: invoice.orderId,
            lines: invoice.lines,
            total: invoice.total
          }));
        });
      }))
      .do(
        () => {
          this._domainEventBus.raise();
          this._domainEventDispatcher.dispatch();
        },
        () => this._domainEventBus.discard()
      );
  }

}
