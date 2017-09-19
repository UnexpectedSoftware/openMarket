import mysql from 'mysql2/promise';
import * as Rx from "rxjs";

export default class MysqlConnection {
  constructor({config}) {
    this._config = config;
    this._pool$ = this._createPoolConnection();
  }

  _createPoolConnection(){
    /* TODO use config environment */
    return Rx.Observable.of(mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'tienda'
    }));
  }

  getConnection() {
    return this._pool$;
  }

}
