import { toStoredBound } from './sqliteDates';

function allocateId(id, used) {
  const base = id == null ? 'order' : String(id);
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let suffix = 2;
  let next = base + '#' + suffix;
  while (used.has(next)) {
    suffix += 1;
    next = base + '#' + suffix;
  }
  used.add(next);
  return next;
}

function bit(value) {
  if (value == null) {
    return null;
  }
  return value ? 1 : 0;
}

export function replaceSqliteData(database, {categories = [], products = [], orders = []} = {}) {
  const insertCategory = database.prepare('INSERT INTO category (id, name) VALUES (?, ?)');
  const insertProduct = database.prepare(
    'INSERT INTO product (barcode, name, description, price, base_price, stock, stock_min, status, weighted, category_id) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertOrder = database.prepare('INSERT INTO "order" (id, created_at, total) VALUES (?, ?, ?)');
  const insertLine = database.prepare(
    'INSERT INTO line (order_id, barcode, name, price, quantity) VALUES (?, ?, ?, ?, ?)'
  );

  database.exec('BEGIN');
  try {
    database.exec('DELETE FROM line');
    database.exec('DELETE FROM "order"');
    database.exec('DELETE FROM product');
    database.exec('DELETE FROM category');

    const categoryIds = new Set();
    categories.forEach(category => {
      const id = String(category._id);
      insertCategory.run(id, category._name);
      categoryIds.add(id);
    });

    products.forEach(product => {
      const categoryId = product._categoryId == null ? null : String(product._categoryId);
      if (categoryId != null && !categoryIds.has(categoryId)) {
        insertCategory.run(categoryId, categoryId);
        categoryIds.add(categoryId);
      }
      insertProduct.run(
        product._barcode,
        product._name == null ? null : product._name,
        product._description == null ? null : product._description,
        product._price == null ? null : product._price,
        product._basePrice == null ? null : product._basePrice,
        product._stock == null ? null : product._stock,
        product._stockMin == null ? null : product._stockMin,
        product._status == null ? null : product._status,
        bit(product._weighted),
        categoryId
      );
    });

    const usedOrderIds = new Set();
    orders.forEach(order => {
      const id = allocateId(order._id, usedOrderIds);
      insertOrder.run(id, toStoredBound(order._createdAt), order._total);
      (order._lines || []).forEach(line => {
        insertLine.run(id, line.barcode, line.name, line.price, line.quantity);
      });
    });

    database.exec('COMMIT');
  } catch (error) {
    try {
      database.exec('ROLLBACK');
    } catch (rollbackError) {
      // A failed statement can already have ended the transaction.
    }
    throw error;
  }
}

export function seedSqliteIfEmpty(database, data) {
  const count = Number(database.prepare('SELECT count(*) AS total FROM category').get().total);
  if (count === 0) {
    replaceSqliteData(database, data);
  }
}
