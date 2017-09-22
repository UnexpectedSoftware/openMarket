import ProductRepository from "../../domain/product/ProductRepository";

export default class MysqlProductRepository extends ProductRepository {

  constructor({connection, productMapper})  {
    super();
    this._connection = connection;
    this._productMapper  = productMapper;
  }


  findAll({productFilter}){
    return super.findAll({productFilter});
  }

  findAllByName({name, limit, offset}) {
    return super.findAllByName({name, limit, offset});
  }

  findAllWithLowStock({limit, offset}) {
    return super.findAllWithLowStock({limit, offset});
  }

  save({product}) {
    return super.save({product});
  }

  findById({id}) {
    return super.findById({id});
  }

  findByBarcode({barcode}) {
    return super.findByBarcode({barcode});
  }

  findAllStatuses() {
    return super.findAllStatuses();
  }

  countProducts() {
    return super.countProducts();
  }

  countProductsByName() {
    return super.countProductsByName();
  }

  countProductsWithLowStock() {
    return super.countProductsWithLowStock();
  }
}
