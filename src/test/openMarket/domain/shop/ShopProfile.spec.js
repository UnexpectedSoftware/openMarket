import {expect} from 'chai';
import ShopProfile from '../../../../openMarket/domain/shop/ShopProfile';
import TaxId from '../../../../openMarket/domain/shop/TaxId';

describe('ShopProfile', () => {
  it('starts empty', () => {
    const profile = ShopProfile.empty();
    expect(profile.nif).to.equal(null);
    expect(profile.legalName).to.equal('');
    expect(profile.tradeName).to.equal('');
    expect(profile.address).to.deep.equal({
      street: '', postalCode: '', city: '', province: '', country: 'ES'
    });
    expect(profile.timeZone).to.equal('Europe/Madrid');
    expect(profile.invoicingEnabled).to.equal(false);
    expect(profile.isComplete()).to.equal(false);
    expect(profile.snapshot()).to.equal(null);
  });

  it('keeps a counted zone and treats a name without a NIF as incomplete', () => {
    const profile = new ShopProfile({
      nif: null,
      legalName: 'Shop',
      tradeName: null,
      address: null,
      timeZone: 'Atlantic/Canary'
    });
    expect(profile.legalName).to.equal('Shop');
    expect(profile.tradeName).to.equal('');
    expect(profile.timeZone).to.equal('Atlantic/Canary');
    expect(profile.address).to.deep.equal({
      street: '', postalCode: '', city: '', province: '', country: 'ES'
    });
    expect(profile.isComplete()).to.equal(false);
    expect(profile.snapshot()).to.equal(null);
  });

  it('drops a string passed where a NIF belongs and a missing legal name', () => {
    const profile = new ShopProfile({nif: 'B12345674', legalName: null, tradeName: undefined, timeZone: ''});
    expect(profile.nif).to.equal(null);
    expect(profile.legalName).to.equal('');
    expect(profile.tradeName).to.equal('');
    expect(profile.timeZone).to.equal('Europe/Madrid');
    expect(profile.invoicingEnabled).to.equal(false);
  });

  it('stores a street and stays incomplete when the legal name is blank', () => {
    const profile = new ShopProfile({
      nif: TaxId.parse('B12345674'),
      legalName: '   ',
      tradeName: 'Pérez',
      address: {street: 'Mayor 1', city: 'Madrid'},
      invoicingEnabled: true
    });
    expect(profile.nif.value).to.equal('B12345674');
    expect(profile.address.street).to.equal('Mayor 1');
    expect(profile.address.country).to.equal('ES');
    expect(profile.invoicingEnabled).to.equal(true);
    expect(profile.isComplete()).to.equal(false);
    expect(profile.snapshot()).to.equal(null);
  });

  it('snapshots a complete profile', () => {
    const address = {street: 'Mayor 1', postalCode: '28001', city: 'Madrid', province: 'Madrid', country: 'ES'};
    const profile = new ShopProfile({
      nif: TaxId.parse('B12345674'),
      legalName: 'Ultramarinos Pérez SL',
      tradeName: 'Ultramarinos Pérez',
      address,
      invoicingEnabled: false
    });
    expect(profile.isComplete()).to.equal(true);
    expect(profile.snapshot()).to.deep.equal({
      nif: 'B12345674',
      legalName: 'Ultramarinos Pérez SL',
      tradeName: 'Ultramarinos Pérez',
      address
    });
    expect(profile.address).to.not.equal(profile.snapshot().address);
  });
});
