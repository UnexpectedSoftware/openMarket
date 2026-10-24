import {expect} from 'chai';
import {
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

    expect(reducer(closed, {type: 'OTHER'})).to.equal(closed);
  });
});
