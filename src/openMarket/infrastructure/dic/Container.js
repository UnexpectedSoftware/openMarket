import MysqlConnection from "../service/MysqlConnection";

export default class Container {
  constructor({environment}) {
    this._environment = environment;
  }

  buildMysqlConnection(){
    return new MysqlConnection({});
  }



}
