import { FETCH_CATEGORIES } from '../actions/product';


const initialState = {
  categories: []
};

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case FETCH_CATEGORIES:
      let list = [...state.categories, action.categories]
      return {
        ...state,
        list
      };

    default:
      return state;
  }

}
