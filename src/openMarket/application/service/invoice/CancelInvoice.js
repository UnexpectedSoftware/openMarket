import 'rxjs/add/operator/defaultIfEmpty';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/mergeMap';
import InvoiceCancelled from '../../../domain/event/InvoiceCancelled';
import {cancelledPayload} from '../../../domain/invoice/invoicePayload';
import InvoiceNotFoundError from '../../../domain/invoice/InvoiceNotFoundError';
import observableError from '../../../infrastructure/logging/observableError';
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../../domain/invoice/Invoice').default} Invoice */
/** @typedef {import('../../../domain/invoice/InvoiceRepository').default} InvoiceRepository */
/** @typedef {import('../../../domain/Clock').default} Clock */
/** @typedef {import('../../../domain/service/DomainEventBus').default} DomainEventBus */
/** @typedef {import('../../../domain/service/Transaction').default} Transaction */

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
    const instant = cancelledAt == null || String(cancelledAt).trim() === ''
      ? this._clock.now()
      : String(cancelledAt);
    const stamp = this._clock.zoned ? this._clock.zoned({instant}).local : instant;
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
          this._domainEventBus.save(new InvoiceCancelled(cancelledPayload(invoice, {reason: null})));
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
