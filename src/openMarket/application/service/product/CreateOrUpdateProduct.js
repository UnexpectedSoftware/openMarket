/**
 * @class CreateOrUpdateProduct
 */
export default class CreateOrUpdateProduct {
  constructor({ repository, productFactory }) {
    this.repository = repository;
    this.productFactory = productFactory;
  }

  createOrUpdate({ barcode, name, description, price, stock, imageUrl, categoryId }) {
    const product = this.productFactory.createWithImage({
      barcode,
      name,
      description,
      price,
      stock,
      imageUrl,
      categoryId
    });
    return this.repository.save({ product });
  }
}
