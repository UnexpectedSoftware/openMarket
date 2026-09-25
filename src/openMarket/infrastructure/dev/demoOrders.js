import { faker } from '@faker-js/faker';
import { add, multiply } from '../service/floatCalculatorService';

const OPEN_MINUTES = 10 * 60;
const CLOSE_MINUTES = 20 * 60 + 30;
const TICKETS_PER_DAY = { min: 36, max: 64 };

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function formatDisplay(date) {
  const pad = value => String(value).padStart(2, '0');
  return pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + '/' + date.getFullYear() +
    ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
}

function sellableProducts(products) {
  return products.filter(product =>
    product._status === 'ENABLED' &&
    typeof product._name === 'string' &&
    product._name.trim() !== '' &&
    product._price != null &&
    Number.isFinite(Number(product._price))
  );
}

function buildLines(products) {
  const lineCount = faker.number.int({ min: 1, max: Math.min(4, products.length) });
  return faker.helpers.arrayElements(products, lineCount).map(product => ({
    barcode: product._barcode,
    name: product._name,
    price: Number(product._price),
    quantity: faker.number.int({ min: 1, max: 3 })
  }));
}

function lineTotal(lines) {
  return lines.reduce((sum, line) => add(sum, multiply(line.price, line.quantity)), 0);
}

export function buildDemoOrders(products, now = new Date()) {
  faker.seed(481516);
  const catalog = sellableProducts(products);
  if (catalog.length === 0) {
    return [];
  }

  const latest = new Date(now.getTime() - 60 * 1000);
  const firstDay = addDays(startOfDay(now), -6);
  const pending = [];

  for (let index = 0; index < 7; index += 1) {
    const day = addDays(firstDay, index);
    const rangeStart = addMinutes(day, OPEN_MINUTES);
    const rangeEnd = new Date(Math.min(addMinutes(day, CLOSE_MINUTES).getTime(), latest.getTime()));
    if (rangeEnd.getTime() <= rangeStart.getTime()) {
      continue;
    }

    const ticketCount = faker.number.int(TICKETS_PER_DAY);
    for (let ticket = 0; ticket < ticketCount; ticket += 1) {
      const created = new Date(faker.number.int({
        min: rangeStart.getTime(),
        max: rangeEnd.getTime() - 1
      }));
      const lines = buildLines(catalog);
      pending.push({ created, lines, total: lineTotal(lines) });
    }
  }

  pending.sort((left, right) => left.created - right.created);
  return pending.map((order, index) => ({
    _id: String(index + 1),
    _createdAt: formatDisplay(order.created),
    _lines: order.lines,
    _total: order.total
  }));
}
