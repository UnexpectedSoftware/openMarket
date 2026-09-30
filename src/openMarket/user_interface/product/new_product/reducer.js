import {
  FIND_PRODUCT_IMAGE, NEW_PRODUCT_FETCHED_CATEGORIES, NEW_PRODUCT_SAVED, PRODUCT_CLOSE,
  PRODUCT_FETCHED_STATUSES, PRODUCT_IMAGE_FOUND, PRODUCT_IMAGE_LOOKUP_FINISHED, PRODUCT_PAGE_LOADED
} from './action';
import {LIST_PRODUCTS_DETAIL_LOADED} from "../list_products/action";
import ProductStatus from "../../../domain/product/ProductStatus";

function idleImageLookup() {
  return { busy: false, imagePath: null, imageSrc: null };
}

const initialState = {
  categories: [],
  statuses: [],
  initialValues: { status: ProductStatus.ENABLED },
  edition: false,
  formKey: 0,
  imageLookup: idleImageLookup(),
  lookupGeneration: 0
};

function resetForm(state) {
  return {
    ...initialState,
    formKey: state.formKey,
    lookupGeneration: (state.lookupGeneration || 0) + 1
  };
}

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case NEW_PRODUCT_FETCHED_CATEGORIES:
      return {
        ...state,
        categories: action.payload
      };
    case PRODUCT_FETCHED_STATUSES:
      return {
        ...state,
        statuses: action.payload
      };

    case NEW_PRODUCT_SAVED:
      if (action.edition) {
        return state;
      }
      return {
        ...resetForm(state),
        formKey: state.formKey + 1
      };

    case FIND_PRODUCT_IMAGE:
      return {
        ...state,
        imageLookup: {
          ...(state.imageLookup || idleImageLookup()),
          busy: true
        }
      };

    case PRODUCT_IMAGE_FOUND:
      return {
        ...state,
        imageLookup: {
          busy: false,
          imagePath: action.imagePath,
          imageSrc: action.imageSrc
        }
      };

    case PRODUCT_IMAGE_LOOKUP_FINISHED:
      return {
        ...state,
        imageLookup: {
          ...(state.imageLookup || idleImageLookup()),
          busy: false
        }
      };

    case PRODUCT_CLOSE:
      return {
        ...resetForm(state),
        formKey: 0
      };

    case PRODUCT_PAGE_LOADED:
      return {
        ...resetForm(state),
        formKey: 0
      };

    case LIST_PRODUCTS_DETAIL_LOADED:
      return {
        ...state,
        initialValues: action.payload,
        edition: true,
        imageLookup: idleImageLookup(),
        lookupGeneration: (state.lookupGeneration || 0) + 1
      };

    default:
      return state;
  }

}
