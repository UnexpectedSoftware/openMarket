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
    return this._connection.execute({
        query: 'SELECT * FROM `product` LIMIT ? OFFSET ?',
        params: [productFilter.limit,productFilter.offset]
      })
      .flatMap(row => this._productMapper.toDomain({ persistenceProduct:row }))
      .toArray();
  }

  findAllByName({name, limit, offset}) {
    return this._connection.execute({
        query: 'SELECT p.barcode,p.name,p.description,p.stock_min,p.price,p.stock,p.base_price,p.status,p.weighted,' +
        'c.id as category_id,c.name as category_name FROM product p, category c WHERE p.category_id=c.id AND' +
        ' p.name like \'%?%\' LIMIT ? OFFSET ?',
        params: [name,limit,offset]
      })
      .flatMap(row => this._productMapper.toDomain({ persistenceProduct:row }))
      .toArray();
  }

  findAllWithLowStock({limit, offset}) {
    return this._connection.execute({
        query: 'SELECT p.barcode,p.name,p.description,p.stock_min,p.price,p.stock,p.base_price,p.status,p.weighted,' +
        'c.id as category_id,c.name as category_name FROM product p, category c WHERE p.category_id=c.id AND' +
        ' p.stock<=p.stock_min AND p.status = ? LIMIT ? OFFSET ?',
        params: [ProductStatus.ENABLED,limit,offset]
      })
      .flatMap(row => this._productMapper.toDomain({ persistenceProduct:row }))
      .toArray();
  }

  /**
   *
   * @param {Product} product
   * @returns {Observable.<null>}
   */
  save({product}) {
    return this._connection.execute({
        query: 'INSERT INTO product (barcode,base_price,category_id,description,name,price,status,stock,stock_min,weighted) ' +
        'VALUES (?,?,?,?,?,?,?,?,?,?)' +
        'ON DUPLICATE KEY UPDATE base_price=VALUES(base_price),category_id=VALUES(category_id),' +
        'description=VALUES(description),name=VALUES(name),price=VALUES(price),status=VALUES(status),stock=VALUES(stock),' +
        'stock_min=VALUES(stock_min),weighted=VALUES(weighted)',
        params: [
          product.barcode,product.basePrice,product.category.id,product.description,product.name,product.price,
          product.status,product.stock,product.stockMin,product.isWeighted?1:0
        ]
      })
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
    return this._connection.execute({
        query: 'SELECT p.barcode,p.name,p.description,p.stock_min,p.price,p.stock,p.base_price,p.status,p.weighted,' +
        'c.id as category_id,c.name as category_name FROM product p, category c WHERE p.category_id=c.id AND' +
        ' p.barcode = ?',
        params: [barcode]
      })
      .flatMap(row => this._productMapper.toDomain({ persistenceProduct:row }));
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
    return this._connection.execute({
        query: 'SELECT count(*) as total FROM `product`'
      })
      .map(row => row.total)
  }

  /**
   * @param {string} name
   * @returns {Observable.<number>}
   */
  countProductsByName({name}) {
    return this._connection.execute({
        query: 'SELECT count(*) as total FROM `product` WHERE name like \'%?%\'',
        params: [name]
      })
      .map(row => row.total)
  }

  /**
   * @returns {Observable.<number>}
   */
  countProductsWithLowStock() {
    return this._connection.execute({
        query: 'SELECT count(*) as total FROM `product` WHERE stock<=stock_min AND status = ?',
        params: [ProductStatus.ENABLED]
      })
      .map(row => row.total)
  }
}
