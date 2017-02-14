export default class ProductMapper {

  /**
   *
   * @param {ProductFactory} productFactory
   */
  constructor({ productFactory }){
    this._productFactory = productFactory;
  }

  toDomain({ jsonProduct }){
    return this._productFactory.createWithId({
      id: jsonProduct._id,
      barcode: jsonProduct._barcode,
      name: jsonProduct._name,
      description: jsonProduct._description,
      price: jsonProduct._price,
      basePrice: jsonProduct._basePrice,
      stock: jsonProduct._stock,
      stockMin: jsonProduct._stockMin,
      categoryId: jsonProduct._categoryId,
      imageUrl: jsonProduct._imageUrl,
      status: jsonProduct._status
    })
  }

}
