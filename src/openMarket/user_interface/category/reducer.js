import {
  CATEGORIES_DELETE_CONFIRM_CLOSED,
  CATEGORIES_DELETE_CONFIRM_OPENED,
  CATEGORIES_DELETE_FAILED,
  CATEGORIES_DELETED,
  CATEGORIES_DIALOG_CLOSED,
  CATEGORIES_DIALOG_OPENED,
  CATEGORIES_DRAFT_CHANGED,
  CATEGORIES_FAILED,
  CATEGORIES_LOADED,
  CATEGORIES_PAGE_LOADED,
  CATEGORIES_QUERY_CHANGED,
  CATEGORIES_SAVE,
  CATEGORIES_SAVED,
  CATEGORIES_SAVE_FAILED
} from './action';
import {
  categoriesFailed,
  categoriesLoaded,
  deleteConfirmClosed,
  deleteConfirmOpened,
  deleteFailed,
  deleted,
  dialogClosed,
  dialogOpened,
  draftChanged,
  pageOpened,
  queryChanged,
  saved,
  saveFailed,
  saveStarted,
  state
} from './model';

export default function reducer(current = state(), action) {
  switch (action.type) {
    case CATEGORIES_PAGE_LOADED:
      return pageOpened(current);
    case CATEGORIES_QUERY_CHANGED:
      return queryChanged(current, action.text);
    case CATEGORIES_LOADED:
      return categoriesLoaded(current, action);
    case CATEGORIES_FAILED:
      return categoriesFailed(current, action.message);
    case CATEGORIES_DIALOG_OPENED:
      return dialogOpened(current, action);
    case CATEGORIES_DIALOG_CLOSED:
      return dialogClosed(current);
    case CATEGORIES_DRAFT_CHANGED:
      return draftChanged(current, action.patch);
    case CATEGORIES_SAVE:
      return saveStarted(current);
    case CATEGORIES_SAVED:
      return saved(current);
    case CATEGORIES_SAVE_FAILED:
      return saveFailed(current, action.message);
    case CATEGORIES_DELETE_CONFIRM_OPENED:
      return deleteConfirmOpened(current, action.id);
    case CATEGORIES_DELETE_CONFIRM_CLOSED:
      return deleteConfirmClosed(current);
    case CATEGORIES_DELETE_FAILED:
      return deleteFailed(current, action.message);
    case CATEGORIES_DELETED:
      return deleted(current);
    default:
      return current;
  }
}
