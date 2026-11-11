import { faker } from '@faker-js/faker';
import Money from '../../domain/money/Money';
import Order from '../../domain/order/Order';
import Quantity from '../../domain/money/Quantity';
import Payment from '../../domain/payment/Payment';
/** @typedef {import('./demoCatalog').DemoProduct} DemoProduct */
/** @typedef {import('../../domain/tax/VatRate').default} VatRate */

/**
 * One sale line as the till sends it to CreateOrder.
 * @typedef {object} DemoLine
 * @property {string} barcode
 * @property {string} name
 * @property {Money} price
 * @property {Quantity} quantity
 * @property {boolean} weighted
 * @property {VatRate} vatRate
 */

/**
 * One historical sale: the moment it happened, its lines, and how it was paid.
 * The lines were already placed on a draft {@link Order}, so they can be sold.
 * @typedef {object} DemoTicket
 * @property {Date} at
 * @property {DemoLine[]} lines
 * @property {Payment} payment
 */

const OPEN_MINUTES = 10 * 60;
const CLOSE_MINUTES = 20 * 60 + 30;
const DAY_SPAN = 45;
const QUIET_DAY_INDEXES = [2, 16];
const KILOS = ['0.25', '0.35', '0.50', '0.75', '1.25'];
const METHODS = ['cash', 'card', 'bizum', 'mixed'];

/**
 * Forty-five shop days of tickets ending at `now`.
 * Two days in that window have no tickets. Weighed lines use kilograms.
 * Only enabled products are sold. Tickets come out in time order, the order the
 * seed sells them in, so CreateOrder numbers the invoices in sequence.
 * @param {DemoProduct[]} products
 * @param {Date} now
 * @returns {DemoTicket[]}
 */
export function buildDemoOrders(products, now) {
  faker.seed(481516);
  const catalog = sellableProducts(products);
  if (catalog.length === 0) {
    return [];
  }
  const latest = new Date(now.getTime() - 60 * 1000);
  const firstDay = addDays(startOfDay(now), -(DAY_SPAN - 1));
  const pending = [];
  for (let index = 0; index < DAY_SPAN; index += 1) {
    collectDay(pending, addDays(firstDay, index), latest, QUIET_DAY_INDEXES.indexOf(index) !== -1, catalog);
  }
  pending.sort((left, right) => left.at - right.at);
  return pending;
}

/**
 * A quiet day and a day that has not opened yet consume no faker values,
 * so the rest of the seed stays put.
 * @param {DemoTicket[]} pending
 * @param {Date} day
 * @param {Date} latest
 * @param {boolean} quiet
 * @param {DemoProduct[]} catalog
 */
function collectDay(pending, day, latest, quiet, catalog) {
  const rangeStart = addMinutes(day, OPEN_MINUTES);
  const rangeEnd = new Date(Math.min(addMinutes(day, CLOSE_MINUTES).getTime(), latest.getTime()));
  if (quiet || rangeEnd.getTime() <= rangeStart.getTime()) {
    return;
  }
  const count = ticketCount(day);
  for (let ticket = 0; ticket < count; ticket += 1) {
    pending.push(buildTicket(catalog, rangeStart, rangeEnd));
  }
}

/**
 * @param {Date} day
 * @returns {number}
 */
function ticketCount(day) {
  const weekday = day.getDay();
  if (weekday === 0) {
    return faker.number.int({min: 4, max: 10});
  }
  if (weekday === 6) {
    return faker.number.int({min: 36, max: 52});
  }
  return faker.number.int({min: 18, max: 32});
}

/**
 * The lines are placed and paid on a draft order first: a line or a payment the
 * till would refuse fails here, before the seed starts.
 * @param {DemoProduct[]} catalog
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 * @returns {DemoTicket}
 */
function buildTicket(catalog, rangeStart, rangeEnd) {
  const at = new Date(faker.number.int({
    min: rangeStart.getTime(),
    max: rangeEnd.getTime() - 1
  }));
  const lines = buildLines(catalog);
  const draft = Order.draft({date: formatDisplay(at)});
  lines.forEach(line => draft.addLine(line));
  draft.place();
  draft.recordPayment(settle(draft.total));
  return {at, lines, payment: draft.payment};
}

/**
 * @param {DemoProduct[]} products
 * @returns {DemoLine[]}
 */
function buildLines(products) {
  const lineCount = faker.number.int({min: 1, max: Math.min(4, products.length)});
  return faker.helpers.arrayElements(products, lineCount).map(product => ({
    barcode: product.barcode,
    name: product.name,
    price: product.price,
    quantity: Quantity.from(product.weighted
      ? faker.helpers.arrayElement(KILOS)
      : faker.number.int({min: 1, max: 3})),
    weighted: product.weighted,
    vatRate: product.vatRate
  }));
}

/**
 * What every ticket sold of each barcode, so the opening stock can cover it.
 * @param {DemoTicket[]} tickets
 * @returns {Map<string, Quantity>}
 */
export function soldQuantities(tickets) {
  const sold = new Map();
  tickets.forEach(ticket => ticket.lines.forEach(line => {
    sold.set(line.barcode, (sold.get(line.barcode) || Quantity.ofMilli(0)).plus(line.quantity));
  }));
  return sold;
}

/**
 * @param {Money} total
 * @returns {Payment}
 */
function settle(total) {
  const method = faker.helpers.arrayElement(METHODS);
  if (method === 'cash') {
    return cashPayment(total);
  }
  if (method === 'bizum') {
    return Payment.bizum({total});
  }
  if (method === 'mixed') {
    return mixedPayment(total);
  }
  return Payment.card({total});
}

/**
 * The next whole euro, or five euros more when the total is already whole,
 * so the till always has change to give.
 * @param {Money} total
 * @returns {Payment}
 */
function cashPayment(total) {
  const nextEuro = Math.ceil(total.cents / 100) * 100;
  const tendered = nextEuro > total.cents ? nextEuro : total.cents + 500;
  return Payment.cash({total, tendered: Money.ofCents(tendered)});
}

/**
 * @param {Money} total
 * @returns {Payment}
 */
function mixedPayment(total) {
  const half = Math.max(1, Math.round(total.cents / 2));
  const cashPart = half >= total.cents ? total.cents - 1 : half;
  return Payment.mixed({
    total,
    parts: [
      {method: 'cash', amountCents: cashPart},
      {method: 'card', amountCents: total.cents - cashPart}
    ]
  });
}

/**
 * @param {DemoProduct[]} products
 * @returns {DemoProduct[]}
 */
function sellableProducts(products) {
  return products.filter(product => product.enabled);
}

/**
 * @param {Date} date
 * @returns {Date}
 */
function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
function addDays(date, days) {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * @param {Date} date
 * @param {number} minutes
 * @returns {Date}
 */
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * @param {Date} date
 * @returns {string}
 */
function formatDisplay(date) {
  const pad = value => String(value).padStart(2, '0');
  return pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + '/' + date.getFullYear() +
    ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
}
