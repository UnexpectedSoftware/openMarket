import CategoryRepository from "../../domain/category/CategoryRepository";
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

const FIND_ALL_SQL = 'SELECT id, name, image_name FROM category';

const FIND_BY_ID_SQL = 'SELECT id, name, image_name FROM category WHERE id = ?';

const INSERT_CATEGORY_SQL = 'INSERT INTO category (id, name, image_name) VALUES (?, ?, ?)';

const UPDATE_CATEGORY_NAME_SQL = 'UPDATE category SET name = ? WHERE id = ? RETURNING id';

const SELECT_CATEGORY_IMAGE_SQL = 'SELECT image_name FROM category WHERE id = ?';

// RETURNING reads image_name after the assignment. MATERIALIZED keeps the
// previous name, and the WHERE clause reads that copy before the write.
const CLEAR_CATEGORY_IMAGE_SQL = `
WITH previous AS MATERIALIZED (
  SELECT id, image_name AS old_image_name
  FROM category
  WHERE id = ?
)
UPDATE category
SET image_name = NULL
WHERE id = (SELECT id FROM previous)
RETURNING (SELECT old_image_name FROM previous) AS previous_image_name
`;

const UPDATE_CATEGORY_IMAGE_SQL = `
WITH previous AS MATERIALIZED (
  SELECT id, image_name AS old_image_name
  FROM category
  WHERE id = ?
)
UPDATE category
SET image_name = ?
WHERE id = (SELECT id FROM previous)
RETURNING (SELECT old_image_name FROM previous) AS previous_image_name
`;

const DELETE_EMPTY_CATEGORY_SQL = `
DELETE FROM category
WHERE id = ?
  AND NOT EXISTS (
    SELECT 1 FROM product WHERE category_id = category.id
  )
RETURNING image_name
`;

const CATEGORY_STILL_THERE_SQL = 'SELECT 1 AS present FROM category WHERE id = ?';

const BEGIN_IMMEDIATE_SQL = 'BEGIN IMMEDIATE';

const COMMIT_SQL = 'COMMIT';

const ROLLBACK_SQL = 'ROLLBACK';

export default class SqliteCategoryRepository extends CategoryRepository {
  constructor({connection, categoryFactory, images, queryService}) {
    super();
    this._database = connection.database;
    this._categoryFactory = categoryFactory;
    this._images = images;
    this._queryService = queryService;
    this._summaries = this._database.prepare(SUMMARIES_SQL);
  }

  findAll() {
    return Rx.Observable.defer(() => {
      const rows = this._database.prepare(FIND_ALL_SQL).all();
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
      this._summaries.all().map(row => this._queryService.summaryFrom(row))
    ));
  }

  findById({id}) {
    return Rx.Observable.defer(() => {
      const row = this._database.prepare(FIND_BY_ID_SQL).get(String(id));
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
        this._database.prepare(INSERT_CATEGORY_SQL).run(category.id, category.name, imageName);
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
      const updated = this._database.prepare(UPDATE_CATEGORY_NAME_SQL).get(name, String(id));
      if (!updated) {
        throw new Error('category not found');
      }
      return Rx.Observable.of(null);
    });
  }

  updateCategory({id, imagePath}) {
    return Rx.Observable.defer(() => {
      const key = String(id);
      const imageName = this._images.store({id: key, sourcePath: imagePath});
      try {
        this._inTransaction(() => {
          const updated = this._database.prepare(UPDATE_CATEGORY_IMAGE_SQL).get(key, imageName);
          if (!updated) {
            throw new Error('category not found');
          }
          if (updated.previous_image_name && updated.previous_image_name !== imageName) {
            this._images.remove(updated.previous_image_name);
          }
        });
      } catch (error) {
        this._discardCopiedImage(key, imageName);
        throw error;
      }
      return Rx.Observable.of(null);
    });
  }

  clearImage({id}) {
    return Rx.Observable.defer(() => {
      const key = String(id);
      this._inTransaction(() => {
        const cleared = this._database.prepare(CLEAR_CATEGORY_IMAGE_SQL).get(key);
        if (!cleared) {
          throw new Error('category not found');
        }
        if (cleared.previous_image_name) {
          this._images.remove(cleared.previous_image_name);
        }
      });
      return Rx.Observable.of(null);
    });
  }

  remove({id}) {
    return Rx.Observable.defer(() => {
      const key = String(id);
      this._inTransaction(() => {
        const deleted = this._database.prepare(DELETE_EMPTY_CATEGORY_SQL).get(key);
        if (!deleted) {
          // The guarded delete matched nothing. A remaining row still has products.
          const stillThere = this._database.prepare(CATEGORY_STILL_THERE_SQL).get(key);
          throw new Error(stillThere ? 'Category still has products' : 'category not found');
        }
        if (deleted.image_name) {
          this._images.remove(deleted.image_name);
        }
      });
      return Rx.Observable.of(null);
    });
  }

  _inTransaction(work) {
    this._database.exec(BEGIN_IMMEDIATE_SQL);
    try {
      work();
      this._database.exec(COMMIT_SQL);
    } catch (error) {
      try {
        this._database.exec(ROLLBACK_SQL);
      } catch (rollbackError) {
        // A failed statement can already have ended the transaction.
      }
      throw error;
    }
  }

  _discardCopiedImage(id, imageName) {
    try {
      const current = this._database.prepare(SELECT_CATEGORY_IMAGE_SQL).get(id);
      if (!current || current.image_name !== imageName) {
        this._images.remove(imageName);
      }
    } catch (cleanupError) {
      // The category change was already rolled back. Keep the original error.
    }
  }
}
