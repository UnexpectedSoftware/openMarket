import {expect} from 'chai';
import SellPreferencesView from '../../../../openMarket/domain/shop/SellPreferencesView';
import ShopProfileView from '../../../../openMarket/domain/shop/ShopProfileView';
import {
  COPY_TOO_LONG,
  EMAIL_TOO_LONG,
  PHONE_TOO_LONG,
  REQUIRED,
  THEME_SAVE_ERROR,
  copyFieldErrors,
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

  it('copies the ticket view into the draft and leaves the issuer alone', () => {
    const ticket = new SellPreferencesView({
      printMode: 'always',
      headerText: 'Hola',
      footerText: 'Pie',
      paperWidthMm: 58
    });
    const current = shopLoaded(state(), view(), {theme: 'mercado', ticket});
    expect(current.draft.printMode).to.equal('always');
    expect(current.draft.headerText).to.equal('Hola');
    expect(current.draft.footerText).to.equal('Pie');
    expect(current.draft.paperWidthMm).to.equal(58);
    expect(current.saved.paperWidthMm).to.equal(58);
    expect(current.issuer).to.equal(current.saved.issuer);
    const edited = draftChanged(current, {headerText: 'Temporal', issuer: {nif: 'NO'}});
    expect(edited.draft.headerText).to.equal('Temporal');
    expect(edited.issuer).to.equal(current.issuer);
    expect(edited.saved.headerText).to.equal('Hola');
    const again = shopLoaded(pageOpened(edited), view(), {theme: 'mercado', ticket: new SellPreferencesView()});
    expect(again.draft.headerText).to.equal('');
    expect(again.draft.printMode).to.equal('ask');
    expect(again.draft.legalName).to.equal('Ultramarinos Pérez SL');
  });

  it('keeps a ticket draft when the sell screen refreshes the shop', () => {
    const ticket = new SellPreferencesView({printMode: 'never', headerText: 'Hola', footerText: '', paperWidthMm: 58});
    const loaded = shopLoaded(state(), view(), {ticket});
    const edited = draftChanged(loaded, {headerText: 'Temporal', legalName: 'Otro'});
    const next = shopLoaded(edited, view({legalName: 'Guardado'}), {keepDraft: true});
    expect(next.draft.headerText).to.equal('Temporal');
    expect(next.draft.legalName).to.equal('Otro');
    expect(next.saved.headerText).to.equal('Hola');
    expect(next.saved.printMode).to.equal('never');
    expect(next.saved.paperWidthMm).to.equal(58);
    expect(next.saved.legalName).to.equal('Guardado');
  });

  it('does not start a save when the header or footer is over 80 characters', () => {
    const header = saveStarted(draftChanged(loaded(), {headerText: 'a'.repeat(81)}));
    expect(header.saving).to.equal(false);
    expect(header.fieldErrors.headerText).to.equal(COPY_TOO_LONG);
    const footer = saveStarted(draftChanged(loaded(), {footerText: 'b'.repeat(81)}));
    expect(footer.saving).to.equal(false);
    expect(footer.fieldErrors.footerText).to.equal(COPY_TOO_LONG);
    const ok = saveStarted(draftChanged(loaded(), {headerText: 'a'.repeat(80), printMode: 'never'}));
    expect(ok.saving).to.equal(true);
    expect(ok.fieldErrors.headerText).to.equal(undefined);
    const spaced = draftChanged(shopLoaded(state(), view(), {
      ticket: new SellPreferencesView({headerText: 'Hola'})
    }), {headerText: '  Hola  '});
    expect(saveStarted(spaced)).to.equal(spaced);
  });

  it('maps a too-long header or footer onto that field', () => {
    expect(copyFieldErrors({context: {field: 'headerText'}})).to.deep.equal({headerText: COPY_TOO_LONG});
    expect(copyFieldErrors({context: {field: 'footerText'}})).to.deep.equal({footerText: COPY_TOO_LONG});
    expect(copyFieldErrors({context: {field: 'printMode'}})).to.equal(null);
    expect(copyFieldErrors(null)).to.equal(null);
  });
});
