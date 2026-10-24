import {expect} from 'chai';
import issuerSnapshot from '../../../../openMarket/domain/shop/issuerSnapshot';
import ShopProfile from '../../../../openMarket/domain/shop/ShopProfile';
import TaxId from '../../../../openMarket/domain/shop/TaxId';

const address = {street: 'Mayor 1', postalCode: '28001', city: 'Madrid', province: 'Madrid', country: 'ES'};

describe('issuerSnapshot', () => {
  it('matches an empty profile', () => {
    const profile = ShopProfile.empty();
    expect(profile.snapshot()).to.equal(null);
    expect(issuerSnapshot({
      nif: null,
      legalName: '',
      tradeName: '',
      address: profile.address
    })).to.equal(null);
    expect(issuerSnapshot({nif: null, legalName: 'Ultramarinos Pérez SL'})).to.equal(null);
    expect(issuerSnapshot({nif: '', legalName: 'Ultramarinos Pérez SL'})).to.equal(null);
    expect(issuerSnapshot({nif: '   ', legalName: 'Ultramarinos Pérez SL'})).to.equal(null);
  });

  it('matches a NIF with a blank legal name', () => {
    const profile = new ShopProfile({
      nif: TaxId.parse('B12345674'),
      legalName: '   ',
      tradeName: 'Pérez'
    });
    expect(profile.isComplete()).to.equal(false);
    expect(profile.snapshot()).to.equal(null);
    expect(issuerSnapshot({
      nif: 'B12345674',
      legalName: '   ',
      tradeName: 'Pérez',
      address: profile.address
    })).to.equal(null);
    expect(issuerSnapshot({nif: 'B12345674', legalName: null, tradeName: 'Pérez'})).to.equal(null);
    expect(issuerSnapshot({nif: 'B12345674', legalName: '', tradeName: 'Pérez'})).to.equal(null);
  });

  it('matches a complete profile and leaves an omitted trade name null', () => {
    const profile = new ShopProfile({
      nif: TaxId.parse('B12345674'),
      legalName: 'Ultramarinos Pérez SL',
      address
    });
    const expected = {
      nif: 'B12345674',
      legalName: 'Ultramarinos Pérez SL',
      tradeName: null,
      address
    };
    expect(profile.snapshot()).to.deep.equal(expected);
    expect(issuerSnapshot({
      nif: 'B12345674',
      legalName: 'Ultramarinos Pérez SL',
      tradeName: '',
      address
    })).to.deep.equal(expected);
    expect(issuerSnapshot({
      nif: 'B12345674',
      legalName: 'Ultramarinos Pérez SL',
      tradeName: 'Ultramarinos Pérez',
      address
    })).to.deep.equal({
      nif: 'B12345674',
      legalName: 'Ultramarinos Pérez SL',
      tradeName: 'Ultramarinos Pérez',
      address
    });
    expect(issuerSnapshot({
      nif: 'B12345674',
      legalName: 'Ultramarinos Pérez SL'
    }).address).to.deep.equal({street: '', postalCode: '', city: '', province: '', country: 'ES'});
    expect(issuerSnapshot({
      nif: 'B12345674',
      legalName: 'Ultramarinos Pérez SL',
      address: {street: 'A', postalCode: 'B', city: 'C', province: 'D', country: 'PT'}
    }).address).to.deep.equal({street: 'A', postalCode: 'B', city: 'C', province: 'D', country: 'PT'});
    expect(issuerSnapshot({
      nif: 'B12345674',
      legalName: 'Ultramarinos Pérez SL',
      address: {street: '', postalCode: '', city: '', province: '', country: ''}
    }).address).to.deep.equal({street: '', postalCode: '', city: '', province: '', country: ''});
    expect(issuerSnapshot({
      nif: 'B12345674',
      legalName: 'Ultramarinos Pérez SL',
      address: {}
    }).address).to.deep.equal({street: '', postalCode: '', city: '', province: '', country: 'ES'});
  });
});
