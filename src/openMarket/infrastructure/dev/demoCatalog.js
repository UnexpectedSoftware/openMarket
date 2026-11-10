import { faker } from '@faker-js/faker';
import catalog from './catalog.json';

const SEED = 201812;
const STOCK_MIN = 5;

/**
 * One category row per catalogue entry.
 * @returns {Array<{_id: string, _name: string}>}
 */
export function buildCategories() {
  return catalog.map((entry, index) => ({
    _id: String(index + 1),
    _name: entry.name
  }));
}

/**
 * Products for those categories. Prices, descriptions, and the exact stock
 * inside a band come from the seeded faker sequence.
 * @param {Array<{_id: string, _name: string}>} categories
 * @returns {object[]}
 */
export function buildProducts(categories) {
  faker.seed(SEED);
  const products = [];
  categories.forEach(category => {
    const entry = catalog.find(item => item.name === category._name);
    const rows = entry ? entry.products : [];
    rows.forEach(row => products.push(buildProduct(row, category._id)));
  });
  return products;
}

/**
 * @param {{barcode: string, name: string, weighted?: boolean, vat?: number, stock?: string, image?: boolean}} row
 * @param {string} categoryId
 * @returns {object}
 */
function buildProduct(row, categoryId) {
  const price = Number(faker.commerce.price({min: 0.8, max: 14, dec: 2}));
  const basePrice = Number(faker.commerce.price({min: 0.3, max: Math.max(price, 0.3), dec: 2}));
  const stock = stockOf(row.stock);
  return {
    _id: row.barcode,
    _barcode: row.barcode,
    _name: row.name,
    _description: faker.commerce.productDescription(),
    _price: price,
    _basePrice: Math.min(basePrice, price),
    _stock: stock.stock,
    _stockMin: STOCK_MIN,
    _weighted: row.weighted === true,
    _categoryId: categoryId,
    _status: stock.status,
    _vatPercent: vatPercent(row.vat),
    _vatKind: 'S1',
    _vatCause: null,
    _imageName: row.image === true ? row.barcode + '.png' : null
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
 * @returns {{stock: number, status: string}}
 */
function stockOf(band) {
  if (band === 'out') {
    return {stock: 0, status: 'ENABLED'};
  }
  if (band === 'low') {
    return {stock: faker.number.int({min: 1, max: STOCK_MIN - 1}), status: 'ENABLED'};
  }
  if (band === 'disabled') {
    return {stock: faker.number.int({min: STOCK_MIN, max: 20}), status: 'DISABLED'};
  }
  return {stock: faker.number.int({min: STOCK_MIN, max: 40}), status: 'ENABLED'};
}
