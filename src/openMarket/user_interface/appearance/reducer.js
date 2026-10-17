import {
  THEME_CHANGED,
  THEME_CHANGE_FAILED,
  THEME_CHANGE_REQUESTED,
  THEME_PREVIEW_DISCARDED,
  THEME_PREVIEWED
} from './action';

const INITIAL = {
  theme: 'mercado',
  applied: 'mercado'
};

export default function reducer(state = INITIAL, action) {
  switch (action.type) {
    case THEME_PREVIEWED:
      return {...state, applied: action.theme};
    case THEME_CHANGE_REQUESTED:
    case THEME_CHANGED:
    case THEME_CHANGE_FAILED:
      return {theme: action.theme, applied: action.theme};
    case THEME_PREVIEW_DISCARDED:
      return {...state, applied: action.theme};
    default:
      return state;
  }
}
