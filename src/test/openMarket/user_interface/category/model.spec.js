import {expect} from 'chai';
import {
  LOAD_ERROR,
  NAME_REQUIRED,
  NOT_FOUND,
  SAVE_ERROR,
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

function listed() {
  return categoriesLoaded(state(), {
    items: [
      {id: 'a', name: 'Alpha', imageUrl: null},
      {id: 'b', name: 'Beta', imageUrl: 'data:image/png,abc'}
    ],
    total: 2
  });
}

describe('categories model', () => {
  it('stores the search text and keeps loading', () => {
    const next = queryChanged(listed(), 'leche');
    expect(next.text).to.equal('leche');
    expect(next.loading).to.equal(true);
    expect(next.error).to.equal('');
    expect(next.items).to.have.length(2);
  });

  it('treats a missing search as empty text', () => {
    expect(queryChanged(state(), null).text).to.equal('');
  });

  it('does not drop the list when the dialog opens and closes', () => {
    const current = listed();
    const opened = dialogOpened(current, {mode: 'create'});
    expect(opened.items).to.equal(current.items);
    expect(opened.dialog.mode).to.equal('create');
    expect(opened.dialog.name).to.equal('');
    const closed = dialogClosed(opened);
    expect(closed.dialog).to.equal(null);
    expect(closed.items).to.deep.equal(current.items);
  });

  it('locks the edited id to the list row', () => {
    const opened = dialogOpened(listed(), {mode: 'edit', id: 'b'});
    expect(opened.dialog.id).to.equal('b');
    expect(opened.dialog.name).to.equal('Beta');
    expect(opened.dialog.imageUrl).to.equal('data:image/png,abc');
    const renamed = draftChanged(opened, {id: 'other', mode: 'create', name: 'Nuevo'});
    expect(renamed.dialog.id).to.equal('b');
    expect(renamed.dialog.mode).to.equal('edit');
    expect(renamed.dialog.name).to.equal('Nuevo');
    expect(renamed.items[1].name).to.equal('Beta');
  });

  it('ignores edit of an unknown id and a draft when the dialog is closed', () => {
    const current = listed();
    const initial = state();
    expect(dialogOpened(current, {mode: 'edit', id: 'missing'})).to.equal(current);
    expect(draftChanged(initial, {name: 'Pan'})).to.equal(initial);
  });

  it('does not start a save for a blank name', () => {
    const opened = draftChanged(dialogOpened(state(), {mode: 'create'}), {name: '   '});
    const next = saveStarted(opened);
    expect(next.dialog.saving).to.equal(false);
    expect(next.dialog.name).to.equal('');
    expect(next.dialog.nameError).to.equal(NAME_REQUIRED);
  });

  it('does not start a save while a file is rejected or a save is already running', () => {
    const opened = draftChanged(dialogOpened(state(), {mode: 'create'}), {
      name: 'Pan',
      fileError: 'Usa una imagen JPEG, PNG, GIF o WebP'
    });
    const rejected = saveStarted(opened);
    expect(rejected.dialog.saving).to.equal(false);
    expect(rejected.dialog.nameError).to.equal(null);
    const running = saveStarted(draftChanged(dialogOpened(state(), {mode: 'create'}), {name: 'Pan'}));
    expect(saveStarted(running)).to.equal(running);
  });

  it('throws the draft away on close, so nothing is restored', () => {
    const opened = dialogOpened(listed(), {mode: 'edit', id: 'a'});
    const dirtied = draftChanged(opened, {name: 'Cambiado'});
    const closed = dialogClosed(dirtied);
    expect(closed.dialog).to.equal(null);
    expect(closed.items[0].name).to.equal('Alpha');
  });

  it('clears a chosen photo and a later file replaces that clear', () => {
    const opened = dialogOpened(listed(), {mode: 'edit', id: 'b'});
    const cleared = draftChanged(opened, {clearImage: true, imagePath: '/tmp/a.png'});
    expect(cleared.dialog.clearImage).to.equal(true);
    expect(cleared.dialog.imagePath).to.equal(null);
    expect(cleared.dialog.imageUrl).to.equal(null);
    const replaced = draftChanged(cleared, {imagePath: '/tmp/b.png', fileError: 'nope'});
    expect(replaced.dialog.imagePath).to.equal('/tmp/b.png');
    expect(replaced.dialog.clearImage).to.equal(false);
    expect(replaced.dialog.fileError).to.equal(null);
    expect(replaced.dialog.nameError).to.equal(null);
  });

  it('closes the dialog after a save and keeps the failure on it', () => {
    const opened = dialogOpened(listed(), {mode: 'create'});
    const started = saveStarted(draftChanged(opened, {name: 'Pan'}));
    expect(started.dialog.saving).to.equal(true);
    expect(started.dialog.name).to.equal('Pan');
    expect(saved(started).dialog).to.equal(null);
    expect(saved(started).items).to.have.length(2);
    const failed = saveFailed(started, NOT_FOUND);
    expect(failed.dialog.saving).to.equal(false);
    expect(failed.dialog.error).to.equal(NOT_FOUND);
    expect(failed.items).to.have.length(2);
    expect(saveFailed(state()).dialog).to.equal(null);
    expect(saveFailed(started).dialog.error).to.equal(SAVE_ERROR);
  });

  it('keeps the list when the page opens again and records a load failure', () => {
    const current = listed();
    const reopened = pageOpened(dialogOpened(current, {mode: 'create'}));
    expect(reopened.loading).to.equal(true);
    expect(reopened.items).to.equal(current.items);
    expect(reopened.dialog.mode).to.equal('create');
    expect(categoriesFailed(current).error).to.equal(LOAD_ERROR);
    expect(categoriesFailed(current, 'db down').error).to.equal('db down');
    expect(categoriesLoaded(current, {}).items).to.deep.equal([]);
    expect(categoriesLoaded(current, {}).total).to.equal(0);
  });
});
