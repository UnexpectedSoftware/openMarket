import CategoryRepository from "../../domain/category/CategoryRepository";

export default class MysqlCategoryRepository extends CategoryRepository{
  constructor({connection, categoryFactory}){
    super();
    this._connection = connection;
    this._categoryFactory = categoryFactory;
  }


  findAll() {
    return this._connection.execute({
      query:  'SELECT * FROM `category`'
    })
      .map(row => this._categoryFactory.createWithId({
        id: row.id,
        name: row.name
      }))
      .toArray();
  }

  findById({id}) {
    return this._connection.execute({
      query: 'SELECT * FROM `category` WHERE id = ?',
      params: [id]
    })
      .map(row => this._categoryFactory.createWithId({
        id: row.id,
        name: row.name
      }));
  }

  save({name}) {
    return this._connection.execute({
      query: 'INSERT INTO `category` (name) VALUES (?)',
      params: [name]
    })
      .map(result => this._categoryFactory.createWithId({
        id: result.insertId,
        name: name
      }));
  }

  update({id, name}) {
    return this._connection.execute({
      query: 'UPDATE `category` SET name = ? WHERE id = ?',
      params: [name,id]
    })
      .map(result => null);
  }
}
