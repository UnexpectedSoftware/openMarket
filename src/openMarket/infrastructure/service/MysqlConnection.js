import * as Rx from "rxjs";

export default class MysqlConnection {
  constructor({pool$}) {
    this._pool$ = pool$.getPool();
  }

  getPool() {
    return this._pool$;
  }

  execute({query, params}){
    return this.getPool()
      .flatMap(pool =>
        Rx.Observable.fromPromise(pool.query(query,params))
      )
      .flatMap(result => Rx.Observable.from(result))
      .first()
      .flatMap(rows => Array.isArray(rows) ? Rx.Observable.from(rows) : Rx.Observable.of(rows));
  }

  beginTransaction() {
    return this.getPool()
      .flatMap(pool => Rx.Observable.fromPromise(pool.getConnection()))
      .flatMap(connection =>
        Rx.Observable.fromPromise(connection.beginTransaction())
          .map(transaction => connection)
      );
  }



}
