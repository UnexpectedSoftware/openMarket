import CategoryRepository from "../../domain/category/CategoryRepository";
import * as Rx from "rxjs";

export default class SqliteCategoryRepository extends CategoryRepository {
  constructor({connection, categoryFactory}) {
    super();
    this._database = connection.database;
    this._categoryFactory = categoryFactory;
  }

  findAll() {
    return Rx.Observable.defer(() => {
      const rows = this._database.prepare('SELECT id, name FROM category').all();
      return Rx.Observable.from(rows)
        .map(row => this._categoryFactory.createWithId({
          id: row.id,
          name: row.name
        }))
        .toArray();
    });
  }

  findById({id}) {
    return Rx.Observable.defer(() => {
      const row = this._database.prepare('SELECT id, name FROM category WHERE id = ?').get(String(id));
      if (!row) {
        return Rx.Observable.empty();
      }
      return Rx.Observable.of(this._categoryFactory.createWithId({
        id: row.id,
        name: row.name
      }));
    });
  }

  save({name}) {
    return Rx.Observable.defer(() => {
      const category = this._categoryFactory.createWith({name});
      this._database.prepare('INSERT INTO category (id, name) VALUES (?, ?)').run(category.id, category.name);
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
}
