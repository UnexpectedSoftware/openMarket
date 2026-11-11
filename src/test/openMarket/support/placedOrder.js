import Order from '../../../openMarket/domain/order/Order';

/**
 * A placed order for the fixture inserter, built line by line through {@link Order#addLine}.
 * @param {{id: string, date: string, lines: Array<object>, payment?: object}} params
 * @returns {{order: Order, invoice: null}}
 */
export default function placedOrder({id, date, lines, payment}) {
  const order = Order.draft({id, date});
  lines.forEach(line => order.addLine(line));
  order.place();
  if (payment) {
    order.recordPayment(payment);
  }
  return {order, invoice: null};
}
