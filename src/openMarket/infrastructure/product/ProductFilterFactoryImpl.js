import ProductFilter from '../../domain/product/ProductFilter';
/** @typedef {import('../../domain/product/ProductFilterFactory').default} ProductFilterFactory */

/** @implements {ProductFilterFactory} */
export default class ProductFilterFactoryImpl {



    /**
     * @param {{limit: number, offset: number}} filter
     * @returns {ProductFilter}
     */
  createWith({ limit, offset }) {
    return new ProductFilter({ limit, offset });
  }

    /**
     *
     * @returns {ProductFilter}
     */
  createWithDefaults() {
    return new ProductFilter();
  }


}
