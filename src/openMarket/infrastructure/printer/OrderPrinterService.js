import 'rxjs/add/operator/defaultIfEmpty';
import 'rxjs/add/operator/mergeMap';
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
 * @property {string} [id]
 * @property {string} createdAt
 * @property {string} [invoiceNumber]
 * @property {{nif?: string, legalName?: string, tradeName?: string} | null} [issuer]
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

  constructor({ printerConnection, invoiceRepository }){
    this._connection = printerConnection;
    this._invoices = invoiceRepository || null;
  }

  /**
   * @param {{order: PrintableOrder}} command
   * @returns {Observable<boolean>}
   */
  print({order}){
    if (!this._invoices || order == null || order.id == null) {
      return this._connection.print(printer => this._fill(printer, order, null));
    }
    return this._invoices.findByOrderId({orderId: order.id})
      .defaultIfEmpty(null)
      .flatMap(invoice => this._connection.print(printer => this._fill(printer, order, invoice)));
  }

  /**
   * @param {*} printer
   * @param {PrintableOrder} order
   * @param {import('../../domain/invoice/Invoice').default | null} invoice
   */
  _fill(printer, order, invoice) {
    const issuer = invoice && invoice.issuer ? invoice.issuer : order.issuer;
    const title = issuer && (issuer.tradeName || issuer.legalName);
    const when = invoice ? `${invoice.issueDate} ${invoice.issuedAt}` : order.createdAt;
    const number = invoice ? invoice.invoiceNumber.formatted : order.invoiceNumber;
    printer.alignCenter();
    printer.setTextDoubleHeight();
    printer.setTextDoubleWidth();
    if (title) {
      printer.println(title);
    }
    printer.setTextNormal();
    if (issuer && issuer.nif) {
      printer.println('NIF ' + issuer.nif);
    }
    if (number) {
      printer.println(number);
    }
    printer.println(`Date ${when} `);
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
  }

}
