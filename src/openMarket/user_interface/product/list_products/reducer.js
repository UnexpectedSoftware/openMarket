import {LIST_PRODUCT_FETCHED} from './action';


const initialState = {
  products: []
};

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case LIST_PRODUCT_FETCHED:
      return {
        ...state,
        products: action.payload
      };

    default:
      return state;
  }

}
