import { faker } from '@faker-js/faker';
import catalog from './catalog.json';

export function buildCategories() {
  return catalog.map((entry, index) => ({
    _id: String(index + 1),
    _name: entry.name
  }));
}

export function buildProducts(categories) {
  faker.seed(201812);
  const products = [];
  categories.forEach(category => {
    const entry = catalog.find(item => item.name === category._name);
    const rows = entry ? entry.products : [];
    rows.forEach(row => {
      const sequence = products.length;
      const price = Number(faker.commerce.price({min: 1, max: 12, dec: 2}));
      const basePrice = Number(faker.commerce.price({min: 0.4, max: Math.max(price, 0.4), dec: 2}));
      const stockMin = 5;
      const disabled = sequence < 2;
      const lowStock = sequence >= 2 && sequence < 5;
      products.push({
        _id: row.barcode,
        _barcode: row.barcode,
        _name: row.name,
        _description: faker.commerce.productDescription(),
        _price: price,
        _basePrice: Math.min(basePrice, price),
        _stock: disabled ? 8 : (lowStock ? faker.number.int({min: 0, max: stockMin - 1}) : faker.number.int({min: stockMin, max: 40})),
        _stockMin: stockMin,
        _weighted: faker.datatype.boolean(),
        _categoryId: category._id,
        _status: disabled ? 'DISABLED' : 'ENABLED'
      });
    });
  });
  return products;
}
