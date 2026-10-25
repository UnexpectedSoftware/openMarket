import {
  SETTINGS_DRAFT_CHANGED,
  SETTINGS_FAILED,
  SETTINGS_LOADED,
  SETTINGS_PAGE_OPENED,
  SETTINGS_SAVE_FAILED,
  SETTINGS_SAVE_REQUESTED,
  SETTINGS_SAVED,
  SHOP_PROFILE_LOADED
} from './action';
import {
  draftChanged,
  loadFailed,
  pageOpened,
  saved,
  saveFailed,
  saveStarted,
  shopLoaded,
  state
} from './model';

export default function reducer(current = state(), action) {
  switch (action.type) {
    case SETTINGS_PAGE_OPENED:
      return pageOpened(current);
    case SETTINGS_LOADED:
      return shopLoaded(current, action.profile, {theme: action.theme});
    case SHOP_PROFILE_LOADED:
      return shopLoaded(current, action.profile, {keepDraft: true});
    case SETTINGS_FAILED:
      return loadFailed(current, action.message);
    case SETTINGS_DRAFT_CHANGED:
      return draftChanged(current, action.patch);
    case SETTINGS_SAVE_REQUESTED:
      return saveStarted(current);
    case SETTINGS_SAVED:
      return saved(current, action.profile, action.theme);
    case SETTINGS_SAVE_FAILED:
      return saveFailed(current, action.failure);
    default:
      return current;
  }
}
