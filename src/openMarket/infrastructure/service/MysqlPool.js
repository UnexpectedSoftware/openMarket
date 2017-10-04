import mysql from 'mysql2/promise';
import * as Rx from "rxjs";

export default class MysqlPool {
  constructor({config}){
    this._config = config;
  }

  getPool(){
    return Rx.Observable.of(mysql.createPool({
        ...this._config.mysql
    }));
  }
}
