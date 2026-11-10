import { expect } from 'chai';
import ShopProfile from '../../../../openMarket/domain/shop/ShopProfile';
import TaxId from '../../../../openMarket/domain/shop/TaxId';
import { buildProfile } from '../../../../openMarket/infrastructure/dev/demoShop';

describe('Demo shop', () => {
  const profile = buildProfile();

  it('names a complete Spanish shop', () => {
    const shop = new ShopProfile({
      ...profile,
      nif: TaxId.parse(profile.nif)
    });
    expect(shop.isComplete()).to.equal(true);
    expect(shop.tradeName).to.equal('Ultramarinos La Plaza');
    expect(shop.legalName).to.equal('Ana Ruiz García');
    expect(shop.nif.value).to.equal('12345678Z');
    expect(shop.address).to.deep.equal({
      street: 'Calle Mayor 12',
      postalCode: '28013',
      city: 'Madrid',
      province: 'Madrid',
      country: 'ES'
    });
    expect(shop.timeZone).to.equal('Europe/Madrid');
    expect(shop.invoicingEnabled).to.equal(true);
    expect(shop.phone).to.equal('913456789');
    expect(shop.email).to.equal('hola@ultramarinoslaplaza.example');
    expect(shop.snapshot().tradeName).to.equal('Ultramarinos La Plaza');
  });
});
