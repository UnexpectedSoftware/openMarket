import ProductRepository from "../../domain/product/ProductRepository";
import * as Rx from "rxjs";
import ProductStatus from "../../domain/product/ProductStatus";

export default class MysqlProductRepository extends ProductRepository {

  /**
   * @param {MysqlConnection} connection
   * @param {MysqlProductMapper} productMapper
   */
  constructor({connection, productMapper})  {
    super();
    this._connection = connection;
    this._productMapper  = productMapper;
  }

  /**
   *
   * @param {ProductFilter} productFilter
   * @returns {Observable.<Array<Product>>}
   */
  findAll({productFilter}){
    return this._connection.getConnection()
      .flatMap(connection =>
        Rx.Observable.fromPromise(connection.execute('SELECT * FROM `product` LIMIT ? OFFSET ?',[productFilter.limit,productFilter.offset]))
      )
      .flatMap(result => Rx.Observable.from(result))
      .first()
      .flatMap(row => this._productMapper.toDomain({ persistenceProduct:row }))
      .toArray();
  }

  findAllByName({name, limit, offset}) {
    return this._connection.getConnection()
      .flatMap(connection =>
        Rx.Observable.fromPromise(connection.execute(
          'SELECT p.barcode,p.name,p.description,p.stock_min,p.price,p.stock,p.base_price,p.status,p.weighted,' +
          'c.id as category_id,c.name as category_name FROM product p, category c WHERE p.category_id=c.id AND' +
          ' p.name like \'%?%\' LIMIT ? OFFSET ?',[name,limit,offset])
        )
      )
      .flatMap(result => Rx.Observable.from(result))
      .first()
      .flatMap(rows => Rx.Observable.from(rows))
      .flatMap(row => this._productMapper.toDomain({ persistenceProduct:row }));
  }

  findAllWithLowStock({limit, offset}) {
    return this._connection.getConnection()
      .flatMap(connection =>
        Rx.Observable.fromPromise(connection.execute(
          'SELECT p.barcode,p.name,p.description,p.stock_min,p.price,p.stock,p.base_price,p.status,p.weighted,' +
          'c.id as category_id,c.name as category_name FROM product p, category c WHERE p.category_id=c.id AND' +
          ' p.stock<=p.stock_min AND p.status = ? LIMIT ? OFFSET ?',[ProductStatus.ENABLED,limit,offset])
        )
      )
      .flatMap(result => Rx.Observable.from(result))
      .first()
      .flatMap(rows => Rx.Observable.from(rows))
      .flatMap(row => this._productMapper.toDomain({ persistenceProduct:row }))
      .toArray();
  }

  /**
   *
   * @param {Product} product
   * @returns {Observable.<null>}
   */
  save({product}) {
    console.log(product);
    return this._connection.getConnection()
      .flatMap(connection =>
        Rx.Observable.fromPromise(connection.execute(
          'INSERT INTO product (barcode,base_price,category_id,description,name,price,status,stock,stock_min,weighted) ' +
          'VALUES (?,?,?,?,?,?,?,?,?,?)' +
          'ON DUPLICATE KEY UPDATE base_price=VALUES(base_price),category_id=VALUES(category_id),' +
          'description=VALUES(description),name=VALUES(name),price=VALUES(price),status=VALUES(status),stock=VALUES(stock),' +
          'stock_min=VALUES(stock_min),weighted=VALUES(weighted)',
          [
            product.barcode,product.basePrice,product.category.id,product.description,product.name,product.price,
            product.status,product.stock,product.stockMin,product.isWeighted?1:0
          ])
        )
      )
      .map(result => null)
  }

  findById({id}) {
    return super.findById({id});
  }

  /**
   *
   * @param {string} barcode
   * @returns {Observable.<Product>}
   */
  findByBarcode({barcode}) {
    return this._connection.getConnection()
      .flatMap(connection =>
        Rx.Observable.fromPromise(connection.execute(
          'SELECT p.barcode,p.name,p.description,p.stock_min,p.price,p.stock,p.base_price,p.status,p.weighted,' +
          'c.id as category_id,c.name as category_name FROM product p, category c WHERE p.category_id=c.id AND' +
          ' p.barcode = ?',[barcode])
        )
      )
      .flatMap(result => Rx.Observable.from(result))
      .first()
      .flatMap(rows => this._productMapper.toDomain({ persistenceProduct:rows[0] }));
  }

  findAllStatuses() {
    let statuses = [];
    for (var [key, value] of Object.entries(ProductStatus)) {
      statuses.push({key:key,value:value});
    }
    return Rx.Observable.of(statuses);
  }

  /**
   * @returns {Observable.<number>}
   */
  countProducts() {
    return this._connection.getConnection()
      .flatMap(connection =>
        Rx.Observable.fromPromise(connection.execute('SELECT count(*) as total FROM `product`'))
      )
      .flatMap(result => Rx.Observable.from(result))
      .first()
      .map(row => row[0].total)
  }

  /**
   * @param {string} name
   * @returns {Observable.<number>}
   */
  countProductsByName({name}) {
    return this._connection.getConnection()
      .flatMap(connection =>
        Rx.Observable.fromPromise(connection.execute('SELECT count(*) as total FROM `product` WHERE name like \'%?%\'',[name]))
      )
      .flatMap(result => Rx.Observable.from(result))
      .first()
      .map(row => row[0].total)
  }

  /**
   * @returns {Observable.<number>}
   */
  countProductsWithLowStock() {
    return this._connection.getConnection()
      .flatMap(connection =>
        Rx.Observable.fromPromise(connection.execute('SELECT count(*) as total FROM `product` WHERE stock<=stock_min AND status = ?',[ProductStatus.ENABLED]))
      )
      .flatMap(result => Rx.Observable.from(result))
      .first()
      .map(row => row[0].total)
  }
}
