import {expect} from 'chai';
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
} from '../../../../openMarket/user_interface/category/action';
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
  saveFailed,
  saveStarted,
  saved,
  state
} from '../../../../openMarket/user_interface/category/model';
import reducer from '../../../../openMarket/user_interface/category/reducer';

describe('categories reducer', () => {
  it('starts from the model and delegates each action', () => {
    const initial = reducer(undefined, {type: '@@INIT'});
    expect(initial).to.deep.equal(state());

    const opened = reducer(initial, {type: CATEGORIES_PAGE_LOADED});
    expect(opened).to.deep.equal(pageOpened(initial));

    const typed = reducer(opened, {type: CATEGORIES_QUERY_CHANGED, text: 'pan'});
    expect(typed).to.deep.equal(queryChanged(opened, 'pan'));

    const loaded = reducer(typed, {
      type: CATEGORIES_LOADED,
      items: [{id: 'a', name: 'Alpha'}],
      total: 1
    });
    expect(loaded).to.deep.equal(categoriesLoaded(typed, {
      items: [{id: 'a', name: 'Alpha'}],
      total: 1
    }));

    const failed = reducer(loaded, {type: CATEGORIES_FAILED, message: 'db down'});
    expect(failed).to.deep.equal(categoriesFailed(loaded, 'db down'));

    const editing = reducer(loaded, {type: CATEGORIES_DIALOG_OPENED, mode: 'edit', id: 'a'});
    expect(editing).to.deep.equal(dialogOpened(loaded, {mode: 'edit', id: 'a'}));

    const draft = reducer(editing, {type: CATEGORIES_DRAFT_CHANGED, patch: {name: 'Alfa'}});
    expect(draft).to.deep.equal(draftChanged(editing, {name: 'Alfa'}));

    const saving = reducer(draft, {type: CATEGORIES_SAVE});
    expect(saving).to.deep.equal(saveStarted(draft));

    const rejected = reducer(saving, {type: CATEGORIES_SAVE_FAILED, message: 'No se encuentra la categoría'});
    expect(rejected).to.deep.equal(saveFailed(saving, 'No se encuentra la categoría'));

    const done = reducer(saving, {type: CATEGORIES_SAVED});
    expect(done).to.deep.equal(saved(saving));

    const closed = reducer(editing, {type: CATEGORIES_DIALOG_CLOSED});
    expect(closed).to.deep.equal(dialogClosed(editing));

    const confirming = reducer(loaded, {type: CATEGORIES_DELETE_CONFIRM_OPENED, id: 'a'});
    expect(confirming).to.deep.equal(deleteConfirmOpened(loaded, 'a'));

    const refused = reducer(confirming, {
      type: CATEGORIES_DELETE_FAILED,
      message: 'La categoría todavía tiene productos'
    });
    expect(refused).to.deep.equal(deleteFailed(confirming, 'La categoría todavía tiene productos'));

    const cancelled = reducer(confirming, {type: CATEGORIES_DELETE_CONFIRM_CLOSED});
    expect(cancelled).to.deep.equal(deleteConfirmClosed(confirming));

    const gone = reducer(confirming, {type: CATEGORIES_DELETED});
    expect(gone).to.deep.equal(deleted(confirming));

    expect(reducer(closed, {type: 'OTHER'})).to.equal(closed);
  });
});
