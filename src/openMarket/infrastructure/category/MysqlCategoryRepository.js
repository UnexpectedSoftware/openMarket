import CategoryRepository from "../../domain/category/CategoryRepository";
import * as Rx from "rxjs";

export default class MysqlCategoryRepository extends CategoryRepository{
  constructor({connection, categoryFactory}){
    super();
    this._connection = connection;
    this._categoryFactory = categoryFactory;
  }


  findAll() {
    return this._connection.getConnection()
      .flatMap(connection =>
        Rx.Observable.fromPromise(connection.execute('SELECT * FROM `category`'))
      )
      .flatMap(result => Rx.Observable.from(result))
      .first()
      .map(rows  => rows.map(row =>this._categoryFactory.createWithId({
        id: row.id,
        name: row.name
      })));
  }

  findById({id}) {
    return this._connection.getConnection()
      .flatMap(connection =>
        Rx.Observable.fromPromise(connection.execute('SELECT * FROM `category` WHERE id = ?',[id]))
      )
      .flatMap(result => Rx.Observable.from(result))
      .first()
      .flatMap(result => Rx.Observable.from(result))
      .first()
      .map(row => this._categoryFactory.createWithId({
        id: row.id,
        name: row.name
      }));
  }

  save({name}) {
    return this._connection.getConnection()
      .flatMap(connection =>
        Rx.Observable.fromPromise(connection.execute('INSERT INTO `category` (name) VALUES (?)',[name]))
      )
      .flatMap(resultAndFields => Rx.Observable.from(resultAndFields))
      .first()
      .map(result => this._categoryFactory.createWithId({
        id: result.insertId,
        name: name
      }));
  }

  update({id, name}) {
    return this._connection.getConnection()
      .flatMap(connection =>
        Rx.Observable.fromPromise(connection.execute('UPDATE `category` SET name = ? WHERE id = ?',[name,id]))
      )
      .map(resultAndFields => null);
  }
}
