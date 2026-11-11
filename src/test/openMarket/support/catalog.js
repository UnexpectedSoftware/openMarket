import Category from '../../../openMarket/domain/category/Category';
import Money from '../../../openMarket/domain/money/Money';
import Product from '../../../openMarket/domain/product/Product';
import ProductStatus from '../../../openMarket/domain/product/ProductStatus';
/** @typedef {import('../../../openMarket/domain/tax/VatRate').default} VatRate */

/**
 * @param {string} id
 * @param {string} [name]
 * @returns {Category}
 */
export function shopCategory(id, name = 'Category ' + id) {
  return new Category({id, name});
}

/**
 * A product built through {@link Product.create}. Prices are euro strings.
 * @param {{barcode: string, name: string, price: string, basePrice?: string, stock?: number, stockMin?: number, category?: Category, status?: string, weighted?: boolean, vatRate?: VatRate | null}} product
 * @returns {Product}
 */
export function shopProduct({
  barcode,
  name,
  price,
  basePrice = '0.30',
  stock = 100,
  stockMin = 10,
  category = shopCategory('1'),
  status = ProductStatus.ENABLED,
  weighted = false,
  vatRate = null
}) {
  return Product.create({
    barcode,
    name,
    description: '',
    price: Money.fromEuros(price),
    basePrice: Money.fromEuros(basePrice),
    stock,
    stockMin,
    weighted,
    category,
    status,
    vatRate
  });
}
