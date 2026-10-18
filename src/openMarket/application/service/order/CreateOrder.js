import {Observable} from "rxjs/Observable";
import {record} from "../../../infrastructure/logging/ErrorLog";
import observableError from "../../../infrastructure/logging/observableError";
import "rxjs/add/observable/of";
import "rxjs/add/operator/do";
import "rxjs/add/operator/map";
import "rxjs/add/operator/toArray";
import "rxjs/add/operator/defaultIfEmpty";
import VatRate from "../../../domain/tax/VatRate";
import InvoiceType from "../../../domain/invoice/InvoiceType";
import ShopProfileIncompleteError from "../../../domain/shop/ShopProfileIncompleteError";
import OrderCreated from "../../../domain/event/OrderCreated";
import InvoiceIssued from "../../../domain/event/InvoiceIssued";
import ProductWithLowStock from "../../../domain/event/ProductWithLowStock";
import Invoice from "../../../domain/invoice/Invoice";
import {issuedPayload} from "../../../domain/invoice/invoicePayload";
import Money from "../../../domain/money/Money";
import Quantity from "../../../domain/money/Quantity";
import ErrorCode from "../../../domain/error/ErrorCode";
import InvalidOrderLineError from "../../../domain/order/InvalidOrderLineError";
import InvalidOrderQuantityError from "../../../domain/order/InvalidOrderQuantityError";
/** @typedef {import("../../../domain/order/Order").default} Order */
/** @typedef {import("../../../domain/order/Order").OrderLine} OrderLine */
/** @typedef {import("../../../domain/order/OrderFactory").default} OrderFactory */
/** @typedef {import("../../../domain/order/OrderRepository").default} OrderRepository */
/** @typedef {import("../../../domain/product/ProductRepository").default} ProductRepository */
/** @typedef {import("../../../domain/invoice/InvoiceRepository").default} InvoiceRepository */
/** @typedef {import("../../../domain/invoice/InvoiceSequence").default} InvoiceSequence */
/** @typedef {import("../../../domain/Identity").default} Identity */
/** @typedef {import("../../../domain/Clock").default} Clock */
/** @typedef {import("../../../domain/service/DomainEventBus").default} DomainEventBus */
/** @typedef {import("../../../domain/service/Transaction").default} Transaction */

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
   * @param {import('../../../domain/shop/ShopProfileRepository').default} [deps.shopProfileRepository]
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
    domainEventDispatcher,
    shopProfileRepository
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
    this._shopProfileRepository = shopProfileRepository;
  }

  /**
   * Places the order, stores it with its invoice, and subtracts stock.
   * Those writes commit together. The series is the shop's local year of the issue time.
   * A payment, when present, is checked against the order total before the insert.
   * It is not copied onto the invoice payload.
   * @param {{lines: OrderLine[], payment?: {method?: string, tendered?: *, tenderedCents?: number}}} order
   * @returns {Observable<Order>}
   */
  createOrder({lines, payment}) {
    const saved = this._transaction.run(() => this._loadProfile()
      .flatMap(profile => this._loadProducts({lines})
      .flatMap(products => {
        const order = this._buildOrder({lines: stampVat(lines, products)});
        return order.flatMap(draft => {
          const settled = applyPayment(draft, payment);
          if (settled.error) {
            return observableError(settled.error);
          }
          return this._orderRepository.save({order: settled.order})
          .flatMap(() => this._subtrackStock({order: settled.order, products}))
          .flatMap(({lowStockProducts}) => this._issueInvoice({order: settled.order, profile})
            .map(invoice => ({order: settled.order, invoice, lowStockProducts})));
        });
      }))
      .do(({order, invoice, lowStockProducts}) => {
        this._domainEventBus.save(new OrderCreated({
          id: order.id,
          createdAt: order.createdAt,
          lines: order.lines.map(lineSnapshot)
        }));
        this._domainEventBus.save(new InvoiceIssued(issuedPayload(invoice)));
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
        const order = this._orderFactory.createWith({});
        (lines || []).forEach(line => {
          if (line && line.kind === 'FREE') {
            order.addFreeLine({
              description: line.description || line.name,
              amount: line.amount != null ? line.amount : line.price,
              vatRate: line.vatRate
            });
          } else {
            order.addLine(line);
          }
        });
        observer.next(order.place());
      } catch (error) {
        observer.error(record(saleError(error)));
      }
      observer.complete();
    })
  }

  /**
   * The stored shop, or null when this process has no settings repository.
   * @returns {Observable<import('../../../domain/shop/ShopProfile').default | null>}
   */
  _loadProfile() {
    if (!this._shopProfileRepository) {
      return Observable.of(null);
    }
    return this._shopProfileRepository.find().defaultIfEmpty(null);
  }

  /**
   * @param {{order: Order, profile: import('../../../domain/shop/ShopProfile').default | null}} command
   * @returns {Observable<Invoice>}
   */
  _issueInvoice({order, profile}) {
    if (profile && profile.invoicingEnabled && !profile.isComplete()) {
      return observableError(new ShopProfileIncompleteError());
    }
    const zoned = this._clock.zonedNow();
    const series = zoned.date.slice(0, 4);
    return this._invoiceSequence.next({series})
      .flatMap(invoiceNumber => {
        let invoice;
        try {
          invoice = Invoice.issue({
            id: this._identity.generate(),
            invoiceNumber,
            issuedAt: zoned.local,
            issueDate: zoned.date,
            issuer: profile && profile.snapshot ? profile.snapshot() : null,
            type: InvoiceType.F2,
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
   * @param {{lines: Array<{kind?: 'PRODUCT' | 'FREE', barcode?: string}>}} command
   * @returns {Observable<Map<string, *>>}
   */
  _loadProducts({lines}) {
    const barcodes = [];
    (lines || []).forEach(line => {
      if (line && line.kind === 'FREE') {
        return;
      }
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
        if (line && line.kind === 'FREE') {
          return Observable.empty();
        }
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
 * Attaches a payment when the caller sent one. A missing payment leaves the order as it was.
 * @param {Order} order
 * @param {{method?: string, tendered?: *, tenderedCents?: number} | null | undefined} payment
 * @returns {{order: Order, error?: *}}
 */
function applyPayment(order, payment) {
  if (payment == null) {
    return {order};
  }
  try {
    order.recordPayment(payment);
    return {order};
  } catch (error) {
    return {order, error};
  }
}

/**
 * addLine reports every refusal as an invalid line. A quantity that is not
 * a positive number stays the quantity error the sale already raised.
 * @param {*} error
 * @returns {*}
 */
function saleError(error) {
  if (error instanceof InvalidOrderLineError
    && error.context
    && error.context.reason === ErrorCode.ORDER_QUANTITY_INVALID) {
    return new InvalidOrderQuantityError({
      quantity: error.context.quantity,
      barcode: error.context.barcode
    });
  }
  return error;
}

/**
 * Copies the product's rate onto the line. A missing product keeps the general rate.
 * @param {Array<{kind?: 'PRODUCT' | 'FREE', barcode?: string}>} lines
 * @param {Map<string, *>} products
 * @returns {Array<object>}
 */
function stampVat(lines, products) {
  return (lines || []).map(line => {
    if (line && line.kind === 'FREE') {
      return line;
    }
    const product = products.get(line && line.barcode != null ? String(line.barcode) : '');
    const vatRate = product && product.vatRate != null ? product.vatRate : VatRate.standard();
    if (product && typeof product.isWeighted === 'boolean') {
      return {...line, vatRate, weighted: product.isWeighted};
    }
    return {...line, vatRate};
  });
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
