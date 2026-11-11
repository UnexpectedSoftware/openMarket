import Order from '../../../openMarket/domain/order/Order';
/** @typedef {import('../../../openMarket/domain/money/Money').default} Money */
/** @typedef {import('../../../openMarket/domain/money/Quantity').default} Quantity */
/** @typedef {import('../../../openMarket/domain/tax/VatRate').default} VatRate */
/** @typedef {import('../../../openMarket/domain/payment/Payment').default} Payment */

/**
 * A placed order, built line by line through {@link Order#addLine}.
 * @param {{id: string, date: string, lines: Array<{barcode: string, name: string, price: Money, quantity: Quantity, weighted?: boolean, vatRate?: VatRate}>, payment?: Payment}} params
 * @returns {Order}
 */
export default function placedOrder({id, date, lines, payment}) {
  const order = Order.draft({id, date});
  lines.forEach(line => order.addLine(line));
  order.place();
  if (payment) {
    order.recordPayment(payment);
  }
  return order;
}
