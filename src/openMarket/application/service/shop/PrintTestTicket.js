import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import {receiptBlock} from '../../../domain/receipt/ReceiptBlock';
import SellPreferencesQuery from '../../../domain/shop/SellPreferencesQuery';
import ShopProfileQuery from '../../../domain/shop/ShopProfileQuery';
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../../domain/shop/ShopProfileRepository').default} ShopProfileRepository */
/** @typedef {import('../../../domain/shop/SellPreferencesRepository').default} SellPreferencesRepository */
/** @typedef {import('../../../domain/shop/ShopProfileView').default} ShopProfileView */
/** @typedef {import('../../../domain/shop/SellPreferencesView').default} SellPreferencesView */

/**
 * Prints a non-fiscal sample: the ticket copy, the shop name, the NIF when
 * there is one, and "Prueba de impresión". It does not create an order, an
 * invoice, or a plugin slot. The printer reads the saved device settings.
 */
export default class PrintTestTicket {

  /**
   * @param {object} deps
   * @param {ShopProfileRepository} deps.shopProfileRepository
   * @param {SellPreferencesRepository} deps.sellPreferencesRepository
   * @param {{print: (command: {receipt: {blocks: object[]}}) => Observable<boolean>}} deps.orderPrinterService
   */
  constructor({shopProfileRepository, sellPreferencesRepository, orderPrinterService}) {
    this._shop = shopProfileRepository;
    this._sell = sellPreferencesRepository;
    this._printer = orderPrinterService;
  }

  /** @returns {Observable<boolean>} */
  print() {
    return this._shop.find(new ShopProfileQuery())
      .flatMap(shop => this._sell.find(new SellPreferencesQuery()).map(sell => sample(shop, sell)))
      .flatMap(receipt => this._printer.print({receipt}));
  }

}

/**
 * @param {ShopProfileView} shop
 * @param {SellPreferencesView} sell
 * @returns {{blocks: object[]}}
 */
function sample(shop, sell) {
  const blocks = [];
  pushCopy(blocks, sell && sell.headerText);
  blocks.push(line(shopTitle(shop)));
  pushNif(blocks, shop);
  blocks.push(line('Prueba de impresión'));
  pushCopy(blocks, sell && sell.footerText);
  return {blocks};
}

/**
 * @param {object[]} blocks
 * @param {ShopProfileView} shop
 */
function pushNif(blocks, shop) {
  const nif = shop && shop.nif ? String(shop.nif).trim() : '';
  if (nif === '') {
    return;
  }
  blocks.push(line('NIF ' + nif));
}

/**
 * @param {object[]} blocks
 * @param {string | null | undefined} value
 */
function pushCopy(blocks, value) {
  const text = value == null ? '' : String(value).trim();
  if (text === '') {
    return;
  }
  blocks.push(line(text));
}

/**
 * Trade name, then legal name, then "OpenMarket".
 * @param {ShopProfileView} shop
 * @returns {string}
 */
function shopTitle(shop) {
  const trade = trimmed(shop && shop.tradeName);
  if (trade !== '') {
    return trade;
  }
  const legal = trimmed(shop && shop.legalName);
  if (legal !== '') {
    return legal;
  }
  return 'OpenMarket';
}

/**
 * @param {string | null | undefined} value
 * @returns {string}
 */
function trimmed(value) {
  return value == null ? '' : String(value).trim();
}

/**
 * @param {string} text
 * @returns {object}
 */
function line(text) {
  return receiptBlock({type: 'text', text});
}
