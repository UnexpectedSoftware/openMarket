/** @import { Observable } from 'rxjs/Observable' */
import VatBreakdown from '../../domain/tax/VatBreakdown';
import Money from '../../domain/money/Money';

/**
 * Receipt line. The ticket prints subtotal, which the order screen adds before printing.
 * @typedef {object} PrintableLine
 * @property {string} name
 * @property {number} quantity
 * @property {number} price
 * @property {number} subtotal
 * @property {*} [amount]
 */

/**
 * @typedef {object} PrintableOrder
 * @property {string} createdAt
 * @property {PrintableLine[]} lines
 * @property {number} total
 */

const MAX_CHARACTERS = 19;

function displayEuros(value) {
  if (value != null && typeof value.toEuros === 'function') {
    return value.toEuros();
  }
  return value;
}

function vatRows(order) {
  if (order.vat && order.vat.length) {
    return order.vat;
  }
  if (order.breakdown && order.breakdown.length) {
    return order.breakdown;
  }
  return VatBreakdown.fromLines((order.lines || []).map(line => ({
    amount: line.amount != null ? line.amount : Money.fromEuros(line.subtotal == null ? 0 : line.subtotal),
    vatRate: line.vatRate
  })));
}

function vatLabel(rate) {
  if (rate == null) {
    return '21 %';
  }
  if (rate.kind === 'E') {
    return 'Exento ' + rate.cause;
  }
  if (rate.kind === 'N') {
    return 'No sujeto ' + rate.cause;
  }
  return String(rate.percent) + ' %';
}

function displayUnits(value) {
  if (value != null && typeof value.units === 'number' && typeof value.milli === 'number') {
    return value.units;
  }
  return value;
}

export default class OrderPrinterService {

  constructor({ printerConnection }){
    this._connection = printerConnection;
  }

  /**
   * @param {{order: PrintableOrder}} command
   * @returns {Observable<boolean>}
   */
  print({order}){
    return this._connection.print((printer) => {
      printer.alignCenter();
      printer.setTextDoubleHeight();
      printer.setTextDoubleWidth();
      printer.println('SUPER COMPRIN');
      printer.setTextNormal();
      printer.println('NIF 476359906P');
      printer.println(`Date ${order.createdAt} `);
      printer.drawLine();
      printer.alignLeft();
      printer.newLine();

      printer.tableCustom([
        { text: 'Name', align: 'LEFT', width: 0.40, bold: true },
        { text: 'Qty', align: 'CENTER', width: 0.20, bold: true },
        { text: 'Price', align: 'CENTER', width: 0.20, bold: true },
        { text: 'Subt', align: 'CENTER', width: 0.20, bold: true }
      ]);
      order.lines
        .map(line => ([
          { text: line.name.slice(0, MAX_CHARACTERS), align: 'LEFT', width: 0.40 },
          { text: displayUnits(line.quantity), align: 'CENTER', width: 0.20 },
          { text: displayEuros(line.price), align: 'CENTER', width: 0.20 },
          { text: displayEuros(line.subtotal != null ? line.subtotal : line.amount), align: 'CENTER', width: 0.20 }
        ]))
        .forEach(row => printer.tableCustom(row));

      printer.newLine();
      printer.alignRight();
      printer.print('Total: ');
      printer.bold(true);
      printer.print(displayEuros(order.total));
      printer.print('€');
      printer.newLine();
      printer.alignLeft();
      printer.tableCustom([
        { text: 'IVA %', align: 'LEFT', width: 0.34, bold: true },
        { text: 'Base', align: 'RIGHT', width: 0.33, bold: true },
        { text: 'Cuota', align: 'RIGHT', width: 0.33, bold: true }
      ]);
      vatRows(order).forEach(row => {
        printer.tableCustom([
          { text: vatLabel(row.rate), align: 'LEFT', width: 0.34 },
          { text: displayEuros(row.base), align: 'RIGHT', width: 0.33 },
          { text: displayEuros(row.quota), align: 'RIGHT', width: 0.33 }
        ]);
      });
      printer.cut();
    });
  }

}
