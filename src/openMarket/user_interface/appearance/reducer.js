import {
  LAYOUT_CHANGED,
  LAYOUT_CHANGE_FAILED,
  LAYOUT_CHANGE_REQUESTED,
  LAYOUT_PREVIEW_DISCARDED,
  LAYOUT_PREVIEWED,
  THEME_CHANGED,
  THEME_CHANGE_FAILED,
  THEME_CHANGE_REQUESTED,
  THEME_PREVIEW_DISCARDED,
  THEME_PREVIEWED
} from './action';

const INITIAL = {
  theme: 'mercado',
  applied: 'mercado',
  layout: 'mostrador',
  appliedLayout: 'mostrador'
};

export default function reducer(state = INITIAL, action) {
  switch (action.type) {
    case THEME_PREVIEWED:
      return {...state, applied: action.theme};
    case THEME_CHANGE_REQUESTED:
    case THEME_CHANGED:
    case THEME_CHANGE_FAILED:
      return {...state, theme: action.theme, applied: action.theme};
    case THEME_PREVIEW_DISCARDED:
      return {...state, applied: action.theme};
    case LAYOUT_PREVIEWED:
      return {...state, appliedLayout: action.layout};
    case LAYOUT_CHANGE_REQUESTED:
    case LAYOUT_CHANGED:
    case LAYOUT_CHANGE_FAILED:
      return {...state, layout: action.layout, appliedLayout: action.layout};
    case LAYOUT_PREVIEW_DISCARDED:
      return {...state, appliedLayout: action.layout};
    default:
      return state;
  }
}
