import CategoryRepository from "../../domain/category/CategoryRepository";
import * as Rx from "rxjs";

export default class SqliteCategoryRepository extends CategoryRepository {
  constructor({connection, categoryFactory, images}) {
    super();
    this._database = connection.database;
    this._categoryFactory = categoryFactory;
    this._images = images;
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

  save({name, imagePath}) {
    return Rx.Observable.defer(() => {
      const category = this._categoryFactory.createWith({name});
      let imageName = null;
      if (imagePath) {
        imageName = this._images.store({id: category.id, sourcePath: imagePath});
      }
      try {
        this._database.prepare(
          'INSERT INTO category (id, name, image_name) VALUES (?, ?, ?)'
        ).run(category.id, category.name, imageName);
      } catch (insertError) {
        if (imageName) {
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
}
