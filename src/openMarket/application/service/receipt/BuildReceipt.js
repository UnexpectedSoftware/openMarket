import 'rxjs/add/operator/defaultIfEmpty';
import 'rxjs/add/operator/map';
import {issuedPayload} from '../../../domain/invoice/invoicePayload';
import {coreBlocks} from '../../../domain/receipt/coreBlocks';
/** @import { Observable } from 'rxjs/Observable' */
/** @import InvoiceRepository from '../../../domain/invoice/InvoiceRepository' */
/** @import ReceiptSlots from '../../../infrastructure/receipt/ReceiptSlots' */

/**
 * Builds the ticket for one order: fiscal slot, the shop's blocks, then the footer slot.
 */
export default class BuildReceipt {

  /**
   * @param {object} deps
   * @param {InvoiceRepository} deps.invoiceRepository
   * @param {ReceiptSlots} deps.receiptSlots
   * @param {(error: unknown) => void} [deps.recordError]
   */
  constructor({invoiceRepository, receiptSlots, recordError}) {
    this._invoiceRepository = invoiceRepository;
    this._receiptSlots = receiptSlots;
    this._recordError = typeof recordError === 'function' ? recordError : () => {};
  }

  /**
   * @param {{orderId: string}} query
   * @returns {Observable<{blocks: object[]}>}
   */
  build({orderId}) {
    return this._invoiceRepository.findByOrderId({orderId: orderId == null ? '' : String(orderId)})
      .defaultIfEmpty(null)
      .map(invoice => {
        const payload = invoice ? issuedPayload(invoice) : null;
        const fiscal = this._receiptSlots.blocks({
          slot: 'receipt.header.fiscal',
          payload,
          recordError: this._recordError
        });
        const footer = this._receiptSlots.blocks({
          slot: 'receipt.footer',
          payload,
          recordError: this._recordError
        });
        return {blocks: fiscal.concat(coreBlocks(payload), footer)};
      });
  }

}
