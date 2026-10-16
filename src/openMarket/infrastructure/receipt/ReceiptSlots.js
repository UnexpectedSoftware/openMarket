import InvalidReceiptBlockError from '../../domain/receipt/InvalidReceiptBlockError';
import {receiptBlock} from '../../domain/receipt/ReceiptBlock';

const SLOTS = ['receipt.header.fiscal', 'receipt.footer'];

/**
 * Named places where a plugin can add blocks to the ticket.
 */
export default class ReceiptSlots {

  constructor() {
    /** @type {Array<{pluginId: string, slot: string, render: Function}>} */
    this._entries = [];
  }

  /**
   * @param {{pluginId: string, slot: string, render: (payload: object | null) => object[]}} params
   * @returns {() => void}
   */
  register({pluginId, slot, render}) {
    if (SLOTS.indexOf(slot) === -1 || typeof render !== 'function') {
      throw new InvalidReceiptBlockError({type: slot || '', field: 'slot'});
    }
    const entry = {pluginId, slot, render};
    this._entries.push(entry);
    return () => {
      this._entries = this._entries.filter(item => item !== entry);
    };
  }

  /**
   * Blocks for one slot. A renderer that throws contributes nothing.
   * @param {{slot: string, payload: object | null, recordError?: (error: unknown) => void}} params
   * @returns {object[]}
   */
  blocks({slot, payload, recordError}) {
    const blocks = [];
    this._entries.filter(entry => entry.slot === slot).forEach(entry => {
      try {
        const rendered = entry.render(payload);
        if (!Array.isArray(rendered)) {
          throw new InvalidReceiptBlockError({type: slot, field: 'render'});
        }
        rendered.forEach(block => blocks.push(receiptBlock(block)));
      } catch (error) {
        if (typeof recordError === 'function') {
          recordError(error);
        }
      }
    });
    return blocks;
  }

}
