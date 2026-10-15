import {expect} from 'chai';
import * as Rx from 'rxjs';
import UpdateShopProfile from '../../../../../openMarket/application/service/shop/UpdateShopProfile';
import GetShopProfile from '../../../../../openMarket/application/service/shop/GetShopProfile';
import ShopProfile from '../../../../../openMarket/domain/shop/ShopProfile';
import ErrorCode from '../../../../../openMarket/domain/error/ErrorCode';

function repository() {
  let stored = ShopProfile.empty();
  return {
    find: () => Rx.Observable.of(stored),
    save({profile}) {
      stored = profile;
      return Rx.Observable.of(profile);
    }
  };
}

describe('UpdateShopProfile', () => {
  it('stores a normalised NIF and reads it back', (done) => {
    const shopProfileRepository = repository();
    const update = new UpdateShopProfile({shopProfileRepository});
    const get = new GetShopProfile({shopProfileRepository});
    update.update({
      nif: 'b 12345674',
      legalName: 'Ultramarinos Pérez SL',
      tradeName: 'Ultramarinos Pérez',
      street: 'Mayor 1',
      city: 'Madrid',
      invoicingEnabled: true
    }).flatMap(() => get.getProfile()).subscribe(
      profile => {
        expect(profile.nif.value).to.equal('B12345674');
        expect(profile.legalName).to.equal('Ultramarinos Pérez SL');
        expect(profile.timeZone).to.equal('Europe/Madrid');
        expect(profile.snapshot().nif).to.equal('B12345674');
      },
      error => done(error),
      () => done()
    );
  });

  it('rejects an invalid NIF and a sale flag without a legal name', (done) => {
    const update = new UpdateShopProfile({shopProfileRepository: repository()});
    update.update({nif: '12345678A', legalName: 'Shop'}).subscribe(
      () => done(new Error('stored')),
      error => {
        expect(error.code).to.equal(ErrorCode.TAX_ID_INVALID);
        update.update({nif: '12345678Z', legalName: '  ', invoicingEnabled: true}).subscribe(
          () => done(new Error('stored')),
          second => {
            expect(second.code).to.equal(ErrorCode.SHOP_PROFILE_INCOMPLETE);
            done();
          }
        );
      }
    );
  });
});
