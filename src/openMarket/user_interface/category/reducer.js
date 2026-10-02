import {
  CATEGORIES_CHANGE_FAILED,
  CATEGORIES_FETCHED,
  CATEGORIES_IMAGE_CLEAR,
  CATEGORIES_IMAGE_REPLACE,
  CATEGORIES_RENAME,
  CATEGORIES_SAVE,
  CATEGORIES_SAVED
} from './action';

const initialState = {
  categories: [],
  draftKey: 0,
  savingId: null,
  savingDraft: false,
  changeError: null
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case CATEGORIES_FETCHED:
      return {
        ...state,
        categories: action.categories,
        savingId: null,
        changeError: null
      };
    case CATEGORIES_SAVE:
      return {
        ...state,
        savingDraft: true,
        changeError: null
      };
    case CATEGORIES_SAVED:
      return {
        ...state,
        draftKey: state.draftKey + 1,
        savingDraft: false,
        changeError: null
      };
    case CATEGORIES_RENAME:
    case CATEGORIES_IMAGE_REPLACE:
    case CATEGORIES_IMAGE_CLEAR:
      return {
        ...state,
        savingId: action.id,
        changeError: null
      };
    case CATEGORIES_CHANGE_FAILED:
      return {
        ...state,
        savingId: null,
        savingDraft: false,
        changeError: {id: action.id, message: action.message}
      };
    default:
      return state;
  }
}
