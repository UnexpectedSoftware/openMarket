import {expect} from 'chai';
import ShopProfile from '../../../../openMarket/domain/shop/ShopProfile';
import ShopProfileQuery from '../../../../openMarket/domain/shop/ShopProfileQuery';
import ShopProfileView from '../../../../openMarket/domain/shop/ShopProfileView';

describe('ShopProfileQuery', () => {
  it('constructs and freezes an empty criteria value', () => {
    const query = new ShopProfileQuery();
    expect(Object.isFrozen(query)).to.equal(true);
    expect(Object.keys(query)).to.deep.equal([]);
    expect(() => {
      query.limit = 1;
    }).to.throw(TypeError);
  });
});

describe('ShopProfileView', () => {
  it('freezes the empty view and does not build a shop', () => {
    const view = new ShopProfileView();
    expect(view).to.not.be.instanceof(ShopProfile);
    expect(view.isComplete).to.equal(undefined);
    expect(view.snapshot).to.equal(undefined);
    expect(Object.isFrozen(view)).to.equal(true);
    expect(() => {
      view.nif = 'X';
    }).to.throw(TypeError);
    expect(view.nif).to.equal(null);
    expect(view.legalName).to.equal('');
    expect(view.tradeName).to.equal('');
    expect(view.street).to.equal('');
    expect(view.postalCode).to.equal('');
    expect(view.city).to.equal('');
    expect(view.province).to.equal('');
    expect(view.country).to.equal('ES');
    expect(view.timeZone).to.equal('Europe/Madrid');
    expect(view.invoicingEnabled).to.equal(false);
    expect(view.issuer).to.equal(null);
  });

  it('stores a NIF without checking it and freezes the issuer', () => {
    const view = new ShopProfileView({
      nif: '  B12345674  ',
      legalName: null,
      tradeName: 'Ultramarinos Pérez',
      street: 'Mayor 1',
      postalCode: '28001',
      city: 'Madrid',
      province: 'Madrid',
      country: 'FR',
      timeZone: '',
      invoicingEnabled: true
    });
    expect(view.nif).to.equal('B12345674');
    expect(view.legalName).to.equal('');
    expect(view.country).to.equal('FR');
    expect(view.timeZone).to.equal('Europe/Madrid');
    expect(view.invoicingEnabled).to.equal(true);
    expect(view.issuer).to.equal(null);
    expect(view.street).to.equal('Mayor 1');
  });

  it('copies a complete profile and does not run a NIF check', () => {
    const view = new ShopProfileView({
      nif: 'not-a-nif',
      legalName: 'Ultramarinos Pérez SL',
      tradeName: '',
      street: 'Mayor 1',
      postalCode: '28001',
      city: 'Madrid',
      province: 'Madrid',
      country: 'ES',
      timeZone: 'Atlantic/Canary',
      invoicingEnabled: false
    });
    expect(Object.isFrozen(view.issuer)).to.equal(true);
    expect(Object.isFrozen(view.issuer.address)).to.equal(true);
    expect(() => {
      view.issuer.nif = 'X';
    }).to.throw(TypeError);
    expect(view.issuer).to.deep.equal({
      nif: 'not-a-nif',
      legalName: 'Ultramarinos Pérez SL',
      tradeName: null,
      address: {street: 'Mayor 1', postalCode: '28001', city: 'Madrid', province: 'Madrid', country: 'ES'}
    });
    expect(view.timeZone).to.equal('Atlantic/Canary');
    expect(view.invoicingEnabled).to.equal(false);
  });

  it('treats a blank legal name as no issuer', () => {
    const view = new ShopProfileView({nif: 'B12345674', legalName: '   ', country: ''});
    expect(view.legalName).to.equal('   ');
    expect(view.country).to.equal('ES');
    expect(view.issuer).to.equal(null);
    expect(view.nif).to.equal('B12345674');
  });
});
