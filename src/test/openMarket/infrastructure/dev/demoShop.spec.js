import * as Rx from 'rxjs';
import { expect } from 'chai';
import UpdateShopProfile from '../../../../openMarket/application/service/shop/UpdateShopProfile';
import { buildProfile } from '../../../../openMarket/infrastructure/dev/demoShop';

describe('Demo shop', () => {
  it('names a complete Spanish shop that UpdateShopProfile accepts', () => {
    const updater = new UpdateShopProfile({shopProfileRepository: {save: ({profile}) => Rx.Observable.of(profile)}});
    let shop = null;
    updater.update(buildProfile()).subscribe(saved => { shop = saved; });

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
    expect(shop.invoicingEnabled).to.equal(true);
    expect(shop.phone).to.equal('913456789');
    expect(shop.email).to.equal('hola@ultramarinoslaplaza.example');
  });
});
