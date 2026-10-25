import {expect} from 'chai';
import ShopProfileView from '../../../../openMarket/domain/shop/ShopProfileView';
import {
  EMAIL_TOO_LONG,
  PHONE_TOO_LONG,
  REQUIRED,
  THEME_SAVE_ERROR,
  draftChanged,
  pageOpened,
  saveFailed,
  saveStarted,
  shopLoaded,
  state
} from '../../../../openMarket/user_interface/settings/model';

function view(extra) {
  return new ShopProfileView({
    nif: 'B12345674',
    legalName: 'Ultramarinos Pérez SL',
    tradeName: 'Ultramarinos Pérez',
    street: 'Mayor 1',
    postalCode: '28001',
    city: 'Madrid',
    province: 'Madrid',
    country: 'ES',
    phone: '600',
    email: 'a@b.es',
    invoicingEnabled: false,
    ...extra
  });
}

function loaded(extra, theme) {
  return shopLoaded(state(), view(extra), {theme: theme || 'mercado'});
}

describe('settings model', () => {
  it('copies the shop view and the stored theme into the draft', () => {
    const profile = view();
    const next = shopLoaded(pageOpened(state()), profile, {theme: 'ultramarinos'});
    expect(next.loading).to.equal(false);
    expect(next.draft.nif).to.equal('B12345674');
    expect(next.draft.legalName).to.equal('Ultramarinos Pérez SL');
    expect(next.draft.phone).to.equal('600');
    expect(next.draft.email).to.equal('a@b.es');
    expect(next.draft.country).to.equal('ES');
    expect(next.draft.theme).to.equal('ultramarinos');
    expect(next.persistedTheme).to.equal('ultramarinos');
    expect(next.saved.phone).to.equal('600');
    expect(next.saved.issuer).to.equal(profile.issuer);
    expect(next.issuer).to.equal(profile.issuer);
    const empty = shopLoaded(state(), new ShopProfileView());
    expect(empty.draft.nif).to.equal('');
    expect(empty.draft.phone).to.equal('');
    expect(empty.draft.email).to.equal('');
    expect(empty.draft.country).to.equal('ES');
    expect(empty.draft.theme).to.equal('mercado');
    expect(empty.issuer).to.equal(null);
    expect(shopLoaded(state(), {country: ''}).draft.country).to.equal('ES');
  });

  it('drops an unsaved draft when the page loads again', () => {
    const edited = draftChanged(loaded(), {legalName: 'Temporal'});
    const again = shopLoaded(pageOpened(edited), view(), {theme: 'mercado'});
    expect(again.draft.legalName).to.equal('Ultramarinos Pérez SL');
    expect(again.loading).to.equal(false);
  });

  it('refreshes the issuer without replacing a draft', () => {
    const edited = draftChanged(loaded(), {legalName: 'Temporal'});
    const issuer = {nif: 'B12345674', legalName: 'Otro', tradeName: null, address: {}};
    const next = shopLoaded(edited, {nif: 'B12345674', legalName: 'Otro', issuer}, {keepDraft: true});
    expect(next.draft.legalName).to.equal('Temporal');
    expect(next.draft).to.equal(edited.draft);
    expect(next.issuer).to.equal(issuer);
    expect(next.saved.issuer).to.equal(issuer);
    expect(next.saved.legalName).to.equal('Otro');
  });

  it('leaves the issuer alone when the draft changes', () => {
    const current = loaded();
    const next = draftChanged(current, {legalName: 'Otro', issuer: {nif: 'NO'}});
    expect(next.draft.legalName).to.equal('Otro');
    expect(next.issuer).to.equal(current.issuer);
    expect(next.saved.issuer).to.equal(current.saved.issuer);
    expect(next.saved.legalName).to.equal('Ultramarinos Pérez SL');
    expect(draftChanged(current, {issuer: {nif: 'NO'}})).to.equal(current);
  });

  it('does not start a save for a blank NIF or legal name when invoicing is on', () => {
    const blankNif = saveStarted(draftChanged(loaded(), {invoicingEnabled: true, nif: '  ', legalName: 'Shop'}));
    expect(blankNif.saving).to.equal(false);
    expect(blankNif.fieldErrors).to.deep.equal({nif: REQUIRED});
    const blankName = saveStarted(draftChanged(loaded(), {invoicingEnabled: true, legalName: ''}));
    expect(blankName.saving).to.equal(false);
    expect(blankName.fieldErrors.legalName).to.equal(REQUIRED);
    expect(blankName.fieldErrors.nif).to.equal(undefined);
    const both = saveStarted(draftChanged(loaded(), {invoicingEnabled: true, nif: '', legalName: '   '}));
    expect(both.fieldErrors).to.deep.equal({nif: REQUIRED, legalName: REQUIRED});
  });

  it('does not start a save when nothing changed', () => {
    const current = loaded({invoicingEnabled: true});
    expect(saveStarted(current)).to.equal(current);
    const off = loaded();
    const spaced = draftChanged(off, {nif: '  B12345674  ', phone: '  600  ', email: '  a@b.es  '});
    expect(saveStarted(spaced)).to.equal(spaced);
    expect(spaced.saving).to.equal(false);
  });

  it('starts a save for a shop edit and for a theme edit', () => {
    const current = loaded();
    const shop = saveStarted(draftChanged(current, {tradeName: 'Pérez'}));
    expect(shop.saving).to.equal(true);
    expect(shop.fieldErrors).to.deep.equal({});
    expect(shop.issuer).to.equal(current.issuer);
    const theme = saveStarted(draftChanged(loaded(), {theme: 'ultramarinos'}));
    expect(theme.saving).to.equal(true);
    expect(theme.saved.legalName).to.equal('Ultramarinos Pérez SL');
    expect(theme.draft.theme).to.equal('ultramarinos');
  });

  it('rejects a phone over 40 characters and an email over 80', () => {
    const phoneOk = saveStarted(draftChanged(loaded(), {phone: '6'.repeat(40)}));
    expect(phoneOk.saving).to.equal(true);
    expect(phoneOk.fieldErrors.phone).to.equal(undefined);
    const phone = saveStarted(draftChanged(loaded(), {phone: '6'.repeat(41)}));
    expect(phone.saving).to.equal(false);
    expect(phone.fieldErrors.phone).to.equal(PHONE_TOO_LONG);
    const emailOk = saveStarted(draftChanged(loaded(), {email: 'a'.repeat(80)}));
    expect(emailOk.saving).to.equal(true);
    const email = saveStarted(draftChanged(loaded(), {email: 'a'.repeat(81)}));
    expect(email.saving).to.equal(false);
    expect(email.fieldErrors.email).to.equal(EMAIL_TOO_LONG);
  });

  it('leaves the draft in place when the shop save fails', () => {
    const started = saveStarted(draftChanged(loaded(), {legalName: 'Otro'}));
    const failed = saveFailed(started, {message: 'disk'});
    expect(failed.saving).to.equal(false);
    expect(failed.draft).to.equal(started.draft);
    expect(failed.draft.legalName).to.equal('Otro');
    expect(failed.saveError).to.equal('disk');
    const rolled = saveFailed(saveStarted(draftChanged(loaded(), {legalName: 'Otro', theme: 'ultramarinos'})), {
      message: THEME_SAVE_ERROR,
      theme: 'mercado'
    });
    expect(rolled.draft.legalName).to.equal('Otro');
    expect(rolled.draft.theme).to.equal('mercado');
    expect(rolled.saveError).to.equal(THEME_SAVE_ERROR);
  });
});
