import {LIST_PRODUCTS_DISABLED, LIST_PRODUCTS_FETCHED, LIST_PRODUCTS_FILTER_RESETED, LIST_PRODUCTS_NAME_FILTER_CHANGED} from './action';
import ProductStatus from '../../../domain/product/ProductStatus';
import {state} from './model';

function byEnabledThenBarcode(left, right) {
  const leftRank = left.status === ProductStatus.ENABLED ? 0 : 1;
  const rightRank = right.status === ProductStatus.ENABLED ? 0 : 1;
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }
  if (left.barcode < right.barcode) {
    return -1;
  }
  if (left.barcode > right.barcode) {
    return 1;
  }
  return 0;
}

const initialState = state();

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case LIST_PRODUCTS_FETCHED:
      return {
        ...state,
        products: action.payload.products,
        total_pages: Math.ceil(action.payload.total/state.filters.limit),
        current_page:  action.payload.page
      };

    case LIST_PRODUCTS_NAME_FILTER_CHANGED:
      return {
        ...state,
        filter_type: 'name'
      };

    case LIST_PRODUCTS_FILTER_RESETED:
      return {
        ...state,
        filter_type: undefined
      };

    case LIST_PRODUCTS_DISABLED:
      return {
        ...state,
        products: state.products
          .map(product => (product.barcode === action.payload
            ? {...product, status: ProductStatus.DISABLED}
            : product))
          .sort(byEnabledThenBarcode)
      };

    default:
      return state;
  }

}
