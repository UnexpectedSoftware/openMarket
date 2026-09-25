import { faker } from '@faker-js/faker';

const CATEGORY_COUNT = 8;
const PRODUCTS_PER_CATEGORY = 5;

export function buildCategories() {
  faker.seed(201811);
  const names = new Set();
  const categories = [];
  let guard = 0;
  while (categories.length < CATEGORY_COUNT && guard < 100) {
    guard += 1;
    const name = faker.commerce.department();
    if (names.has(name)) {
      continue;
    }
    names.add(name);
    categories.push({
      _id: String(categories.length + 1),
      _name: name
    });
  }
  return categories;
}

export function buildProducts(categories) {
  faker.seed(201812);
  const products = [];
  categories.forEach(category => {
    for (let index = 0; index < PRODUCTS_PER_CATEGORY; index += 1) {
      const sequence = products.length;
      const price = Number(faker.commerce.price({min: 1, max: 12, dec: 2}));
      const basePrice = Number(faker.commerce.price({min: 0.4, max: Math.max(price, 0.4), dec: 2}));
      const stockMin = 5;
      const disabled = sequence < 2;
      const lowStock = sequence >= 2 && sequence < 5;
      products.push({
        _id: String(1000 + sequence),
        _barcode: String(1000 + sequence),
        _name: faker.commerce.productName(),
        _description: faker.commerce.productDescription(),
        _price: price,
        _basePrice: Math.min(basePrice, price),
        _stock: disabled ? 8 : (lowStock ? faker.number.int({min: 0, max: stockMin - 1}) : faker.number.int({min: stockMin, max: 40})),
        _stockMin: stockMin,
        _weighted: faker.datatype.boolean(),
        _categoryId: category._id,
        _status: disabled ? 'DISABLED' : 'ENABLED'
      });
    }
  });
  return products;
}
