import { faker } from '@faker-js/faker';
import catalog from './catalog.json';
import Money from '../../domain/money/Money';
import VatRate from '../../domain/tax/VatRate';

const SEED = 201812;
const STOCK_MIN = 5;

/**
 * A product as the product form sends it, plus the stock the demo should end with
 * after its forty-five days of sales.
 * @typedef {object} DemoProduct
 * @property {string} barcode
 * @property {string} name
 * @property {string} description
 * @property {Money} price
 * @property {Money} basePrice
 * @property {number} stockMin
 * @property {boolean} weighted
 * @property {VatRate} vatRate
 * @property {string} categoryName
 * @property {number} closingStock
 * @property {boolean} enabled
 * @property {boolean} image
 */

/**
 * One category name per catalogue entry.
 * @returns {Array<{name: string}>}
 */
export function buildCategories() {
  return catalog.map(entry => ({name: entry.name}));
}

/**
 * Products for every catalogue entry. Prices, descriptions, and the exact closing
 * stock inside a band come from the seeded faker sequence.
 * @returns {DemoProduct[]}
 */
export function buildProducts() {
  faker.seed(SEED);
  const products = [];
  catalog.forEach(entry => {
    entry.products.forEach(row => products.push(buildProduct(row, entry.name)));
  });
  return products;
}

/**
 * @param {{barcode: string, name: string, weighted?: boolean, vat?: number, stock?: string, image?: boolean}} row
 * @param {string} categoryName
 * @returns {DemoProduct}
 */
function buildProduct(row, categoryName) {
  const price = Money.fromEuros(faker.commerce.price({min: 0.8, max: 14, dec: 2}));
  const basePrice = Money.fromEuros(faker.commerce.price({min: 0.3, max: Math.max(price.toEuros(), 0.3), dec: 2}));
  const stock = stockOf(row.stock);
  return {
    barcode: row.barcode,
    name: row.name,
    description: faker.commerce.productDescription(),
    price,
    basePrice: basePrice.cents > price.cents ? price : basePrice,
    stockMin: STOCK_MIN,
    weighted: row.weighted === true,
    vatRate: VatRate.standard(vatPercent(row.vat)),
    categoryName,
    closingStock: stock.stock,
    enabled: stock.enabled,
    image: row.image === true
  };
}

/**
 * @param {number} vat
 * @returns {number}
 */
function vatPercent(vat) {
  if (vat === 4 || vat === 10 || vat === 21) {
    return vat;
  }
  return 21;
}

/**
 * @param {string} band
 * @returns {{stock: number, enabled: boolean}}
 */
function stockOf(band) {
  if (band === 'out') {
    return {stock: 0, enabled: true};
  }
  if (band === 'low') {
    return {stock: faker.number.int({min: 1, max: STOCK_MIN - 1}), enabled: true};
  }
  if (band === 'disabled') {
    return {stock: faker.number.int({min: STOCK_MIN, max: 20}), enabled: false};
  }
  return {stock: faker.number.int({min: STOCK_MIN, max: 40}), enabled: true};
}
