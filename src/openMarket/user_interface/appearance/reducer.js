import {THEME_CHANGED, THEME_PREVIEW_DISCARDED, THEME_PREVIEWED} from './action';

const INITIAL = {
  theme: 'mercado',
  applied: 'mercado'
};

export default function reducer(state = INITIAL, action) {
  switch (action.type) {
    case THEME_PREVIEWED:
      return {...state, applied: action.theme};
    case THEME_CHANGED:
      return {theme: action.theme, applied: action.theme};
    case THEME_PREVIEW_DISCARDED:
      return {...state, applied: action.theme};
    default:
      return state;
  }
}
