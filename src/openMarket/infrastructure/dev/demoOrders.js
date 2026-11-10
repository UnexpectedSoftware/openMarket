import { faker } from '@faker-js/faker';
import InvoiceNumber from '../../domain/invoice/InvoiceNumber';
import Money from '../../domain/money/Money';
import Quantity from '../../domain/money/Quantity';
import Payment from '../../domain/payment/Payment';

/**
 * @typedef {object} DemoProduct
 * @property {string} [_barcode]
 * @property {string} [_name]
 * @property {number | null} [_price]
 * @property {string} [_status]
 * @property {boolean} [_weighted]
 * @property {number} [_vatPercent]
 */

/**
 * @typedef {object} DemoLine
 * @property {string} barcode
 * @property {string} name
 * @property {number} price
 * @property {number | string} quantity
 * @property {boolean} weighted
 * @property {number} vatPercent
 * @property {string} vatKind
 * @property {null} vatCause
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
 * Ticket numbers follow the local year and restart when the year changes.
 * @param {DemoProduct[]} products
 * @param {Date} [now]
 * @returns {object[]}
 */
export function buildDemoOrders(products, now = new Date()) {
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
  pending.sort((left, right) => left.created - right.created);
  return assignTickets(pending);
}

/**
 * A quiet day and a day that has not opened yet consume no faker values,
 * so the rest of the seed stays put.
 * @param {Array<{created: Date, lines: DemoLine[], total: Money, payment: Payment}>} pending
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
 * @param {DemoProduct[]} catalog
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 * @returns {{created: Date, lines: DemoLine[], total: Money, payment: Payment}}
 */
function buildTicket(catalog, rangeStart, rangeEnd) {
  const created = new Date(faker.number.int({
    min: rangeStart.getTime(),
    max: rangeEnd.getTime() - 1
  }));
  const lines = buildLines(catalog);
  const total = lineTotal(lines);
  return {created, lines, total, payment: settle(total)};
}

/**
 * @param {DemoProduct[]} products
 * @returns {DemoLine[]}
 */
function buildLines(products) {
  const lineCount = faker.number.int({min: 1, max: Math.min(4, products.length)});
  return faker.helpers.arrayElements(products, lineCount).map(product => ({
    barcode: product._barcode || '',
    name: product._name || '',
    price: Number(product._price),
    quantity: product._weighted === true
      ? faker.helpers.arrayElement(KILOS)
      : faker.number.int({min: 1, max: 3}),
    weighted: product._weighted === true,
    vatPercent: product._vatPercent == null ? 21 : product._vatPercent,
    vatKind: 'S1',
    vatCause: null
  }));
}

/**
 * @param {DemoLine[]} lines
 * @returns {Money}
 */
function lineTotal(lines) {
  let total = Money.ofCents(0);
  lines.forEach(line => {
    total = total.plus(Money.from(line.price).times(Quantity.from(line.quantity)));
  });
  return total;
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
 * @param {Array<{created: Date, lines: DemoLine[], total: Money, payment: Payment}>} pending
 * @returns {object[]}
 */
function assignTickets(pending) {
  const next = new Map();
  return pending.map((order, index) => {
    const series = String(order.created.getFullYear());
    const number = (next.get(series) || 0) + 1;
    next.set(series, number);
    const invoice = new InvoiceNumber({series, number});
    return {
      _id: String(index + 1),
      _createdAt: formatDisplay(order.created),
      _lines: order.lines,
      _total: eurosText(order.total.cents),
      _payment: {
        method: order.payment.method,
        tenderedCents: order.payment.tenderedCents,
        changeCents: order.payment.changeCents,
        parts: order.payment.parts
      },
      _invoice: {
        series: invoice.series,
        number: invoice.number,
        invoiceNumber: invoice.formatted
      }
    };
  });
}

/**
 * @param {DemoProduct[]} products
 * @returns {DemoProduct[]}
 */
function sellableProducts(products) {
  return products.filter(product =>
    product._status === 'ENABLED' &&
    typeof product._name === 'string' &&
    product._name.trim() !== '' &&
    product._price != null &&
    Number.isFinite(Number(product._price))
  );
}

/**
 * @param {number} cents
 * @returns {string}
 */
function eurosText(cents) {
  const abs = Math.abs(cents);
  const text = Math.trunc(abs / 100) + '.' + String(abs % 100).padStart(2, '0');
  return cents < 0 ? '-' + text : text;
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
