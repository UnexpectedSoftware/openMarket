import {Observable} from "rxjs/Observable";
import {record} from "../../../infrastructure/logging/ErrorLog";
import observableError from "../../../infrastructure/logging/observableError";
import "rxjs/add/operator/do";
import "rxjs/add/operator/map";
import "rxjs/add/operator/toArray";
import "rxjs/add/operator/defaultIfEmpty";
import VatRate from "../../../domain/tax/VatRate";
import OrderCreated from "../../../domain/event/OrderCreated";
import InvoiceIssued from "../../../domain/event/InvoiceIssued";
import ProductWithLowStock from "../../../domain/event/ProductWithLowStock";
import Invoice from "../../../domain/invoice/Invoice";
import Money from "../../../domain/money/Money";
import Quantity from "../../../domain/money/Quantity";
/** @import Order from "../../../domain/order/Order" */
/** @import { OrderLine } from "../../../domain/order/Order" */
/** @import OrderFactory from "../../../domain/order/OrderFactory" */
/** @import OrderRepository from "../../../domain/order/OrderRepository" */
/** @import ProductRepository from "../../../domain/product/ProductRepository" */
/** @import InvoiceRepository from "../../../domain/invoice/InvoiceRepository" */
/** @import InvoiceSequence from "../../../domain/invoice/InvoiceSequence" */
/** @import Identity from "../../../domain/Identity" */
/** @import Clock from "../../../domain/Clock" */
/** @import DomainEventBus from "../../../domain/service/DomainEventBus" */
/** @import Transaction from "../../../domain/service/Transaction" */

/**
 * @class CreateOrder
 */
export default class CreateOrder {

  /**
   * @param {object} deps
   * @param {OrderRepository} deps.orderRepository
   * @param {ProductRepository} deps.productRepository
   * @param {InvoiceRepository} deps.invoiceRepository
   * @param {InvoiceSequence} deps.invoiceSequence
   * @param {OrderFactory} deps.orderFactory
   * @param {Identity} deps.identity
   * @param {Clock} deps.clock
   * @param {DomainEventBus} deps.domainEventBus
   * @param {Transaction} deps.transaction
   * @param {{dispatch: () => void}} deps.domainEventDispatcher
   */
  constructor({
    orderRepository,
    productRepository,
    invoiceRepository,
    invoiceSequence,
    orderFactory,
    identity,
    clock,
    domainEventBus,
    transaction,
    domainEventDispatcher
  }) {
    this._orderRepository = orderRepository;
    this._productRepository = productRepository;
    this._invoiceRepository = invoiceRepository;
    this._invoiceSequence = invoiceSequence;
    this._orderFactory = orderFactory;
    this._identity = identity;
    this._clock = clock;
    this._domainEventBus = domainEventBus;
    this._transaction = transaction;
    this._domainEventDispatcher = domainEventDispatcher;
  }

  /**
   * Places the order, stores it with its invoice, and subtracts stock.
   * Those writes commit together. The series is the shop's local year of the issue time.
   * @param {{lines: OrderLine[]}} order
   * @returns {Observable<Order>}
   */
  createOrder({lines}) {
    const saved = this._transaction.run(() => this._loadProducts({lines})
      .flatMap(products => {
        const order = this._buildOrder({lines: stampVat(lines, products)});
        return order.flatMap(draft => this._orderRepository.save({order: draft})
          .flatMap(() => this._subtrackStock({order: draft, products}))
          .flatMap(({lowStockProducts}) => this._issueInvoice({order: draft})
            .map(invoice => ({order: draft, invoice, lowStockProducts}))));
      })
      .do(({order, invoice, lowStockProducts}) => {
        this._domainEventBus.save(new OrderCreated({
          id: order.id,
          createdAt: order.createdAt,
          lines: order.lines.map(lineSnapshot)
        }));
        this._domainEventBus.save(new InvoiceIssued(facts(invoice)));
        lowStockProducts.forEach(product => {
          this._domainEventBus.record(new ProductWithLowStock({
            barcode: product.barcode,
            name: product.name,
            stock: product.stock,
            stockMin: product.stockMin
          }));
        });
      })
      .map(({order}) => order));
    return saved.do(
      () => {
        this._domainEventBus.raise();
        this._domainEventDispatcher.dispatch();
      },
      () => this._domainEventBus.discard()
    );
  }

  _buildOrder({lines})  {
    return Observable.create(observer => {
      try {
        const order = this._orderFactory.createWith({lines}).place();
        observer.next(order);
      } catch (error) {
        observer.error(record(error));
      }
      observer.complete();
    })
  }

  /**
   * @param {{order: Order}} command
   * @returns {Observable<Invoice>}
   */
  _issueInvoice({order}) {
    const issuedAt = this._clock.now();
    const series = this._clock.localDate({instant: issuedAt}).slice(0, 4);
    return this._invoiceSequence.next({series})
      .flatMap(invoiceNumber => {
        let invoice;
        try {
          invoice = Invoice.issue({
            id: this._identity.generate(),
            invoiceNumber,
            issuedAt,
            order
          });
        } catch (error) {
          return observableError(error);
        }
        return this._invoiceRepository.save({invoice}).map(() => invoice);
      });
  }

  /**
   * Loads each barcode once, inside the sale transaction, before the lines are priced.
   * @param {{lines: Array<{barcode: string}>}} command
   * @returns {Observable<Map<string, *>>}
   */
  _loadProducts({lines}) {
    const barcodes = [];
    (lines || []).forEach(line => {
      const barcode = line && line.barcode != null ? String(line.barcode) : '';
      if (barcode !== '' && barcodes.indexOf(barcode) === -1) {
        barcodes.push(barcode);
      }
    });
    return Observable.from(barcodes)
      .flatMap(barcode => this._productRepository.findByBarcode({barcode})
        .map(product => ({barcode, product}))
        .defaultIfEmpty({barcode, product: null}))
      .toArray()
      .map(rows => {
        const loaded = new Map();
        rows.forEach(row => loaded.set(row.barcode, row.product));
        return loaded;
      });
  }

  _subtrackStock({order, products}){
    return Observable.from(order.lines)
      .flatMap(line => {
        const product = products.get(String(line.barcode));
        if (!product) {
          return Observable.empty();
        }
        product.subtractStock({quantity: stockUnits(line.quantity)});
        return this._productRepository.save({product}).map(() => product);
      })
      .toArray()
      .map(products => ({
        order,
        lowStockProducts: products.filter(product => product.isStockLow())
      }));
  }

}

/**
 * Snapshot a subscriber can use without reading the invoice again.
 * Euro fields are for display. Cent and milli fields are the exact amounts.
 * @param {Invoice} invoice
 */
/**
 * Copies the product's rate onto the line. A missing product keeps the general rate.
 * @param {Array<{barcode: string}>} lines
 * @param {Map<string, *>} products
 * @returns {Array<object>}
 */
function stampVat(lines, products) {
  return (lines || []).map(line => {
    const product = products.get(line && line.barcode != null ? String(line.barcode) : '');
    const vatRate = product && product.vatRate != null ? product.vatRate : VatRate.standard();
    return {...line, vatRate};
  });
}

function facts(invoice) {
  return {
    id: invoice.id,
    series: invoice.invoiceNumber.series,
    number: invoice.invoiceNumber.number,
    invoiceNumber: invoice.invoiceNumber.formatted,
    issuedAt: invoice.issuedAt,
    orderId: invoice.orderId,
    lines: invoice.lines.map(lineSnapshot),
    total: invoice.total.toEuros(),
    totalCents: invoice.total.cents
  };
}

/**
 * @param {{barcode: string, name: string, price: Money, quantity: Quantity, amount?: Money}} line
 * @returns {{barcode: string, name: string, price: number, quantity: number, amount: number, priceCents: number, quantityMilli: number, amountCents: number}}
 */
function lineSnapshot(line) {
  const price = Money.from(line.price);
  const quantity = Quantity.from(line.quantity);
  const amount = line.amount == null ? price.times(quantity) : Money.from(line.amount);
  return {
    barcode: line.barcode,
    name: line.name,
    price: price.toEuros(),
    quantity: quantity.units,
    amount: amount.toEuros(),
    priceCents: price.cents,
    quantityMilli: quantity.milli,
    amountCents: amount.cents
  };
}

/**
 * Stock is still stored in units. A weighed sale subtracts 0.35, not 350.
 * @param {Quantity | number | string} quantity
 * @returns {number}
 */
function stockUnits(quantity) {
  return Quantity.from(quantity).units;
}
