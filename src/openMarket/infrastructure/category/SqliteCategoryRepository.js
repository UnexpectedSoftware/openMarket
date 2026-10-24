import * as Rx from "rxjs";
/** @typedef {import("../../domain/category/CategoryRepository").default} CategoryRepository */
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import("../../domain/category/CategoriesQuery").default} CategoriesQuery */
/** @typedef {import("../../domain/category/CategoryView").default} CategoryView */
import CategoryNotFoundError from "../../domain/category/CategoryNotFoundError";
import CategoryNotEmptyError from "../../domain/category/CategoryNotEmptyError";
import {raise, rethrow} from "../logging/ErrorLog";

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

/** @implements {CategoryRepository} */
export default class SqliteCategoryRepository {
  constructor({connection, categoryFactory, images, queryService}) {
    this._database = connection.database;
    this._categoryFactory = categoryFactory;
    this._images = images;
    this._queryService = queryService;
    this._summaries = this._database.prepare(queryService.summariesSql());
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

  /**
   * @param {CategoriesQuery} query
   * @returns {Observable<{items: CategoryView[], total: number}>}
   */
  find(query) {
    return Rx.Observable.defer(() => Rx.Observable.of(this._readViews(query)));
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
        rethrow(insertError, {
          message: 'Could not save the category',
          context: {id: category.id, name: category.name, operation: 'save'}
        });
      }
      return Rx.Observable.of(null);
    });
  }

  update({id, name}) {
    return Rx.Observable.defer(() => {
      const updated = this._database.prepare(UPDATE_CATEGORY_NAME_SQL).get(name, String(id));
      if (!updated) {
        raise(new CategoryNotFoundError({id: String(id), operation: 'rename'}));
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
            raise(new CategoryNotFoundError({id: key, operation: 'replaceImage'}));
          }
          if (updated.previous_image_name && updated.previous_image_name !== imageName) {
            this._images.remove(updated.previous_image_name);
          }
        });
      } catch (error) {
        this._discardCopiedImage(key, imageName);
        rethrow(error, {
          message: 'Could not replace the category image',
          context: {id: key, operation: 'replaceImage'}
        });
      }
      return Rx.Observable.of(null);
    });
  }

  clearImage({id}) {
    return Rx.Observable.defer(() => {
      const key = String(id);
      try {
        this._inTransaction(() => {
          const cleared = this._database.prepare(CLEAR_CATEGORY_IMAGE_SQL).get(key);
          if (!cleared) {
            raise(new CategoryNotFoundError({id: key, operation: 'clearImage'}));
          }
          if (cleared.previous_image_name) {
            this._images.remove(cleared.previous_image_name);
          }
        });
      } catch (error) {
        rethrow(error, {
          message: 'Could not clear the category image',
          context: {id: key, operation: 'clearImage'}
        });
      }
      return Rx.Observable.of(null);
    });
  }

  remove({id}) {
    return Rx.Observable.defer(() => {
      const key = String(id);
      try {
        this._inTransaction(() => {
          const deleted = this._database.prepare(DELETE_EMPTY_CATEGORY_SQL).get(key);
          if (!deleted) {
            // The guarded delete matched nothing. A remaining row still has products.
            const stillThere = this._database.prepare(CATEGORY_STILL_THERE_SQL).get(key);
            if (stillThere) {
              raise(new CategoryNotEmptyError({id: key}));
            }
            raise(new CategoryNotFoundError({id: key, operation: 'delete'}));
          }
          if (deleted.image_name) {
            this._images.remove(deleted.image_name);
          }
        });
      } catch (error) {
        rethrow(error, {
          message: 'Could not delete the category',
          context: {id: key, operation: 'delete'}
        });
      }
      return Rx.Observable.of(null);
    });
  }

  /**
   * @param {CategoriesQuery} query
   * @returns {{items: CategoryView[], total: number}}
   */
  _readViews(query) {
    const page = this._queryService.viewPage(query);
    const rows = this._database.prepare(page.sql).all(...page.params);
    const count = this._database.prepare(page.countSql).get(...page.countParams);
    return {
      items: rows.map(row => this._queryService.viewFrom(row, this._imageUrl(row.image_name))),
      total: Number(count.total)
    };
  }

  /**
   * @param {*} imageName
   * @returns {string | null}
   */
  _imageUrl(imageName) {
    if (imageName && this._images) {
      return this._images.readDataUrl(imageName);
    }
    return null;
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
