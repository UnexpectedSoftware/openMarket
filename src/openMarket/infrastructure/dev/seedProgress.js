import CategoryCreated from '../../domain/event/CategoryCreated';
import OrderCreated from '../../domain/event/OrderCreated';
import ProductCreated from '../../domain/event/ProductCreated';
/** @typedef {import('../../domain/service/DomainEventBus').default} DomainEventBus */

const HEADER = ':: Sembrando tienda demo';
const BAR_WIDTH = 26;
const LABEL_WIDTH = 13;

const STEPS = [
  {key: 'settings', label: 'ajustes', percentOnly: true},
  {key: 'categories', label: 'categorías', percentOnly: false},
  {key: 'products', label: 'productos', percentOnly: false},
  {key: 'orders', label: 'tickets', percentOnly: false},
  {key: 'reports', label: 'informes', percentOnly: false}
];

/**
 * One progress line. Settings is a single step, drawn as a percent.
 * @param {{label: string, current: number, total: number, percentOnly: boolean}} step
 * @returns {string}
 */
export function progressLine({label, current, total, percentOnly}) {
  const capped = total > 0 ? Math.min(current, total) : 0;
  const filled = total > 0 ? Math.round((BAR_WIDTH * capped) / total) : 0;
  const bar = '#'.repeat(filled) + '-'.repeat(BAR_WIDTH - filled);
  const column = (' ' + label).padEnd(LABEL_WIDTH);
  return `${column}[${bar}] ${progressText({current: capped, total, percentOnly})}`;
}

/**
 * Live bars for `npm run fixtures`. It only writes.
 */
export default class SeedProgress {

  /**
   * @param {{out: {write: Function, isTTY?: boolean}}} deps
   */
  constructor({out}) {
    this._out = out;
    this._prepared = false;
    this._finished = false;
    this._attached = false;
    this._drawn = 0;
    /** @type {Set<string>} */
    this._printed = new Set();
    this._counts = emptyCounts();
    this._totals = emptyCounts();
  }

  /**
   * Totals are known before the saga. Settings is always one step.
   * @param {{categories: number, products: number, orders: number}} totals
   */
  prepare({categories, products, orders}) {
    this._counts = emptyCounts();
    this._totals = {settings: 1, categories, products, orders, reports: orders};
    this._prepared = true;
    this._finished = false;
    this._printed = new Set();
    this._drawn = 0;
    if (this._tty()) {
      this._draw();
      return;
    }
    this._write(HEADER + '\n');
  }

  /**
   * Sync handlers see each save while the seed transaction is still open.
   * @param {DomainEventBus} bus
   */
  attach(bus) {
    if (this._attached) {
      return;
    }
    this._attached = true;
    bus.subscribeSync(CategoryCreated, () => this._advance('categories'));
    bus.subscribeSync(ProductCreated, () => this._advance('products'));
    bus.subscribeSync(OrderCreated, () => this._advance('orders'));
  }

  /** The six settings writes finished. The bar goes from 0% to 100%. */
  settingsDone() {
    this._advance('settings');
  }

  /** One order was applied to the sale statistics the Informes screen reads. */
  reportApplied() {
    this._advance('reports');
  }

  /**
   * Leaves the stopped bar on screen. A plain stream also prints the open step.
   */
  finish() {
    if (!this._prepared || this._finished) {
      return;
    }
    this._finished = true;
    if (this._tty()) {
      return;
    }
    const open = STEPS.find(step => this._counts[step.key] < this._totals[step.key]);
    if (!open || this._printed.has(open.key)) {
      return;
    }
    this._write(this._line(open) + '\n');
  }

  /**
   * @param {string} key
   */
  _advance(key) {
    if (!this._prepared) {
      return;
    }
    this._counts[key] += 1;
    if (this._tty()) {
      this._draw();
      return;
    }
    if (this._counts[key] !== this._totals[key] || this._printed.has(key)) {
      return;
    }
    this._printed.add(key);
    const step = STEPS.find(item => item.key === key);
    this._write(this._line(step) + '\n');
  }

  _draw() {
    if (this._drawn > 0) {
      this._write(`\x1b[${this._drawn}A`);
    }
    const lines = [HEADER, ...STEPS.map(step => this._line(step))];
    lines.forEach(line => this._write(`\x1b[2K${line}\n`));
    this._drawn = lines.length;
  }

  /**
   * @param {{key: string, label: string, percentOnly: boolean}} step
   * @returns {string}
   */
  _line(step) {
    return progressLine({
      label: step.label,
      current: this._counts[step.key],
      total: this._totals[step.key],
      percentOnly: step.percentOnly
    });
  }

  /**
   * @returns {boolean}
   */
  _tty() {
    return Boolean(this._out && this._out.isTTY);
  }

  /**
   * @param {string} text
   */
  _write(text) {
    this._out.write(text);
  }

}

/**
 * @param {{current: number, total: number, percentOnly: boolean}} step
 * @returns {string}
 */
function progressText({current, total, percentOnly}) {
  if (percentOnly) {
    if (total <= 0) {
      return '0%';
    }
    return `${Math.floor((100 * current) / total)}%`;
  }
  if (total <= 0) {
    return '0/0';
  }
  const counts = `${current}/${total}`;
  if (current >= total) {
    return counts;
  }
  return `${counts}  ${Math.floor((100 * current) / total)}%`;
}

/**
 * @returns {{settings: number, categories: number, products: number, orders: number, reports: number}}
 */
function emptyCounts() {
  return {settings: 0, categories: 0, products: 0, orders: 0, reports: 0};
}
