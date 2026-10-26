import {expect} from 'chai';
import VatRate from '../../../../../openMarket/domain/tax/VatRate';
import {
  freeLineValid,
  issuerLine,
  placeSearch,
  sellFlags,
  sellView
} from '../../../../../openMarket/user_interface/order/new_order/sellView';

describe('sell view', () => {
  it('reads the shop line and the preset', () => {
    expect(issuerLine(null)).to.deep.equal({shopName: '', subtitle: undefined});
    expect(issuerLine({tradeName: 'Ultramarinos Sol'})).to.deep.equal({
      shopName: 'Ultramarinos Sol',
      subtitle: undefined
    });
    expect(issuerLine({legalName: 'Sol SL', nif: 'B12345674'})).to.deep.equal({
      shopName: 'Sol SL',
      subtitle: 'Sol SL · NIF B12345674'
    });
    expect(issuerLine({nif: 'B12345674'}).subtitle).to.equal('undefined · NIF B12345674');
    expect(sellFlags('escaner')).to.deep.equal({layout: 'escaner', scanner: true, keypad: false});
    expect(sellFlags('tactil').keypad).to.equal(true);
    expect(sellFlags('nope').layout).to.equal('mostrador');
    expect(placeSearch(true, 'field')).to.deep.equal({top: null, catalog: 'field'});
    expect(placeSearch(false, 'field')).to.deep.equal({top: 'field', catalog: null});
  });

  it('accepts a free line only when the description and amount are usable', () => {
    expect(freeLineValid(null)).to.equal(false);
    expect(freeLineValid({freeDescription: '  ', freeAmount: '1'})).to.equal(false);
    expect(freeLineValid({freeDescription: 'Bolsa', freeAmount: '0'})).to.equal(false);
    expect(freeLineValid({freeDescription: 'Bolsa', freeAmount: '3,50'})).to.equal(true);
  });

  it('collects the screen values', () => {
    const view = sellView({
      layout: 'tactil',
      issuer: {tradeName: 'Sol', nif: 'B12345674'},
      categoryId: 'dairy',
      categories: [{id: 'dairy', name: 'Lácteos'}],
      tiles: [{barcode: '1'}],
      tilesStatus: 'ready'
    }, {
      search: 'leche',
      selected: 1,
      freeDescription: 'Bolsa',
      freeAmount: '1',
      freeVat: VatRate.standard().code(),
      freeOpen: true
    });
    expect(view.layout).to.equal('tactil');
    expect(view.keypad).to.equal(true);
    expect(view.shopName).to.equal('Sol');
    expect(view.subtitle).to.equal('Sol · NIF B12345674');
    expect(view.freeValid).to.equal(true);
    expect(view.categoryId).to.equal('dairy');
    expect(view.search).to.equal('leche');
    expect(view.freeOpen).to.equal(true);
    expect(view.helpOpen).to.equal(false);
    const empty = sellView(null, null);
    expect(empty.layout).to.equal('mostrador');
    expect(empty.shopName).to.equal('');
    expect(empty.categories).to.deep.equal([]);
    expect(empty.categoryId).to.equal(null);
    expect(empty.search).to.equal('');
  });
});
