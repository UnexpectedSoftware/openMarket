import { CATEGORIES_FETCHED, CATEGORIES_FORM_CLEARED } from './action';

const initialState = {
  categories: [],
  formKey: 0
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case CATEGORIES_FETCHED:
      return {
        ...state,
        categories: action.categories
      };
    case CATEGORIES_FORM_CLEARED:
      return {
        ...state,
        formKey: state.formKey + 1
      };
    default:
      return state;
  }
}
