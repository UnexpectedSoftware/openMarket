import {expect} from 'chai';
import {
  SETTINGS_DRAFT_CHANGED,
  SETTINGS_FAILED,
  SETTINGS_LOADED,
  SETTINGS_PAGE_OPENED,
  SETTINGS_SAVE_FAILED,
  SETTINGS_SAVE_REQUESTED,
  SETTINGS_SAVED,
  SHOP_PROFILE_LOADED
} from '../../../../openMarket/user_interface/settings/action';
import {
  draftChanged,
  loadFailed,
  pageOpened,
  saved,
  saveFailed,
  saveStarted,
  shopLoaded,
  state
} from '../../../../openMarket/user_interface/settings/model';
import reducer from '../../../../openMarket/user_interface/settings/reducer';

describe('settings reducer', () => {
  it('starts from the model and delegates each action', () => {
    const initial = reducer(undefined, {type: '@@INIT'});
    expect(initial).to.deep.equal(state());

    const opened = reducer(initial, {type: SETTINGS_PAGE_OPENED});
    expect(opened).to.deep.equal(pageOpened(initial));

    const profile = {nif: 'B12345674', legalName: 'Shop', issuer: {nif: 'B12345674'}};
    const loaded = reducer(opened, {type: SETTINGS_LOADED, profile, theme: 'ultramarinos'});
    expect(loaded).to.deep.equal(shopLoaded(opened, profile, {theme: 'ultramarinos'}));

    const edited = reducer(loaded, {type: SETTINGS_DRAFT_CHANGED, patch: {legalName: 'Otro'}});
    expect(edited).to.deep.equal(draftChanged(loaded, {legalName: 'Otro'}));

    const refreshed = reducer(edited, {type: SHOP_PROFILE_LOADED, profile});
    expect(refreshed).to.deep.equal(shopLoaded(edited, profile, {keepDraft: true}));

    const saving = reducer(edited, {type: SETTINGS_SAVE_REQUESTED});
    expect(saving).to.deep.equal(saveStarted(edited));

    const failure = {message: 'disk'};
    const rejected = reducer(saving, {type: SETTINGS_SAVE_FAILED, failure});
    expect(rejected).to.deep.equal(saveFailed(saving, failure));

    const stored = reducer(saving, {type: SETTINGS_SAVED, profile, theme: 'ultramarinos'});
    expect(stored).to.deep.equal(saved(saving, profile, 'ultramarinos'));

    const failed = reducer(opened, {type: SETTINGS_FAILED, message: 'db'});
    expect(failed).to.deep.equal(loadFailed(opened, 'db'));
  });
});
