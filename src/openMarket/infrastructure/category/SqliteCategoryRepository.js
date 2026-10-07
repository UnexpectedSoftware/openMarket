import CategoryRepository from "../../domain/category/CategoryRepository";
import CategorySummary from "../../domain/category/CategorySummary";
import * as Rx from "rxjs";

const SUMMARIES_SQL = `
WITH product_totals AS (
  SELECT category_id,
         COUNT(*) AS product_count,
         COALESCE(SUM(stock), 0) AS stock_total,
         COALESCE(SUM(base_price), 0) AS base_price_total
  FROM product
  WHERE category_id IS NOT NULL
  GROUP BY category_id
),
sales AS (
  SELECT p.category_id AS category_id,
         p.barcode AS barcode,
         COALESCE(p.name, '') AS name,
         SUM(s.quantity) AS quantity,
         SUM(s.amount) AS amount
  FROM product_sale_day s
  INNER JOIN product p ON p.barcode = s.barcode
  WHERE p.category_id IS NOT NULL
  GROUP BY p.category_id, p.barcode, COALESCE(p.name, '')
),
ranked AS (
  SELECT category_id, barcode, name, quantity, amount,
         ROW_NUMBER() OVER (
           PARTITION BY category_id
           ORDER BY quantity DESC, amount DESC, name ASC
         ) AS rank
  FROM sales
)
SELECT c.id, c.name, c.image_name,
       COALESCE(t.product_count, 0) AS product_count,
       COALESCE(t.stock_total, 0) AS stock_total,
       COALESCE(t.base_price_total, 0) AS base_price_total,
       r.barcode AS most_sold_barcode,
       r.name AS most_sold_name,
       r.quantity AS most_sold_quantity
FROM category c
LEFT JOIN product_totals t ON t.category_id = c.id
LEFT JOIN ranked r ON r.category_id = c.id AND r.rank = 1
`;

function summaryFrom(row) {
  return new CategorySummary({
    id: row.id,
    name: row.name,
    imageName: row.image_name,
    productCount: Number(row.product_count),
    stockTotal: Number(row.stock_total),
    basePriceTotal: Number(row.base_price_total),
    mostSold: row.most_sold_name == null ? null : {
      barcode: row.most_sold_barcode,
      name: row.most_sold_name,
      quantity: Number(row.most_sold_quantity)
    }
  });
}

export default class SqliteCategoryRepository extends CategoryRepository {
  constructor({connection, categoryFactory, images}) {
    super();
    this._database = connection.database;
    this._categoryFactory = categoryFactory;
    this._images = images;
    this._summaries = this._database.prepare(SUMMARIES_SQL);
  }

  findAll() {
    return Rx.Observable.defer(() => {
      const rows = this._database.prepare('SELECT id, name, image_name FROM category').all();
      return Rx.Observable.from(rows)
        .map(row => this._categoryFactory.createWithId({
          id: row.id,
          name: row.name,
          imageName: row.image_name
        }))
        .toArray();
    });
  }

  findAllWithStats() {
    return Rx.Observable.defer(() => Rx.Observable.of(
      this._summaries.all().map(summaryFrom)
    ));
  }

  findById({id}) {
    return Rx.Observable.defer(() => {
      const row = this._database.prepare('SELECT id, name, image_name FROM category WHERE id = ?').get(String(id));
      if (!row) {
        return Rx.Observable.empty();
      }
      return Rx.Observable.of(this._categoryFactory.createWithId({
        id: row.id,
        name: row.name,
        imageName: row.image_name
      }));
    });
  }

  save({category, imagePath}) {
    return Rx.Observable.defer(() => {
      let imageName = category.imageName || null;
      if (imagePath) {
        imageName = this._images.store({id: category.id, sourcePath: imagePath});
      }
      try {
        this._database.prepare(
          'INSERT INTO category (id, name, image_name) VALUES (?, ?, ?)'
        ).run(category.id, category.name, imageName);
      } catch (insertError) {
        if (imageName && imageName !== category.imageName) {
          this._images.remove(imageName);
        }
        throw insertError;
      }
      return Rx.Observable.of(null);
    });
  }

  update({id, name}) {
    return Rx.Observable.defer(() => {
      const result = this._database.prepare('UPDATE category SET name = ? WHERE id = ?').run(name, String(id));
      if (Number(result.changes) === 0) {
        return Rx.Observable.throw(new Error('category not found'));
      }
      return Rx.Observable.of(null);
    });
  }

  updateCategory({id, imagePath}) {
    return Rx.Observable.defer(() => {
      const previous = this._database.prepare(
        'SELECT name, image_name FROM category WHERE id = ?'
      ).get(String(id));
      if (!previous) {
        return Rx.Observable.throw(new Error('category not found'));
      }
      const imageName = this._images.store({id, sourcePath: imagePath});
      try {
        const result = this._database.prepare(
          'UPDATE category SET image_name = ? WHERE id = ?'
        ).run(imageName, String(id));
        if (Number(result.changes) === 0) {
          this._images.remove(imageName);
          return Rx.Observable.throw(new Error('category not found'));
        }
      } catch (updateError) {
        if (imageName !== previous.image_name) {
          this._images.remove(imageName);
        }
        return Rx.Observable.throw(updateError);
      }
      if (previous.image_name && previous.image_name !== imageName) {
        this._images.remove(previous.image_name);
      }
      return Rx.Observable.of(null);
    });
  }

  clearImage({id}) {
    return Rx.Observable.defer(() => {
      const key = String(id);
      const previous = this._database.prepare(
        'SELECT image_name FROM category WHERE id = ?'
      ).get(key);
      if (!previous) {
        return Rx.Observable.throw(new Error('category not found'));
      }
      this._database.prepare(
        'UPDATE category SET image_name = NULL WHERE id = ?'
      ).run(key);
      if (previous.image_name) {
        this._images.remove(previous.image_name);
      }
      return Rx.Observable.of(null);
    });
  }

  remove({id}) {
    return Rx.Observable.defer(() => {
      const key = String(id);
      let imageName = null;
      this._database.exec('BEGIN IMMEDIATE');
      try {
        const row = this._database.prepare(
          'SELECT image_name FROM category WHERE id = ?'
        ).get(key);
        if (!row) {
          throw new Error('category not found');
        }
        const countRow = this._database.prepare(
          'SELECT COUNT(*) AS total FROM product WHERE category_id = ?'
        ).get(key);
        if (Number(countRow.total) > 0) {
          throw new Error('Category still has products');
        }
        const result = this._database.prepare(
          'DELETE FROM category WHERE id = ?'
        ).run(key);
        if (Number(result.changes) === 0) {
          throw new Error('category not found');
        }
        imageName = row.image_name;
        this._database.exec('COMMIT');
      } catch (error) {
        try {
          this._database.exec('ROLLBACK');
        } catch (rollbackError) {
          // A failed statement can already have ended the transaction.
        }
        return Rx.Observable.throw(error);
      }
      if (imageName) {
        this._images.remove(imageName);
      }
      return Rx.Observable.of(null);
    });
  }
}
