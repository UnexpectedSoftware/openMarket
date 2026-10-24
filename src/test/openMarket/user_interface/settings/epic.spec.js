import {expect} from 'chai';
import * as Rx from 'rxjs';
import ShopProfile from '../../../../openMarket/domain/shop/ShopProfile';
import ShopProfileView from '../../../../openMarket/domain/shop/ShopProfileView';
import TaxId from '../../../../openMarket/domain/shop/TaxId';
import {
  SHOP_PROFILE_LOADED,
  SHOP_PROFILE_REQUESTED,
  SHOP_PROFILE_SAVE_REQUESTED,
  SHOP_PROFILE_SAVED
} from '../../../../openMarket/user_interface/settings/action';
import {makeShopProfileEpic} from '../../../../openMarket/user_interface/settings/epicFactory';

describe('makeShopProfileEpic', () => {
  const view = new ShopProfileView({
    nif: 'B12345674',
    legalName: 'Ultramarinos Pérez SL',
    tradeName: 'Ultramarinos Pérez',
    street: 'Mayor 1',
    postalCode: '28001',
    city: 'Madrid',
    province: 'Madrid',
    country: 'ES',
    timeZone: 'Europe/Madrid',
    invoicingEnabled: true
  });

  it('stores view fields and does not call snapshot', done => {
    let snapshotted = false;
    const aggregate = new ShopProfile({
      nif: TaxId.parse('B12345674'),
      legalName: 'Ultramarinos Pérez SL',
      tradeName: 'Ultramarinos Pérez',
      address: {street: 'Mayor 1', postalCode: '28001', city: 'Madrid', province: 'Madrid', country: 'ES'},
      invoicingEnabled: true
    });
    aggregate.snapshot = () => {
      snapshotted = true;
      return {nif: 'NO'};
    };
    const epic = makeShopProfileEpic({
      getShopProfile: {getProfile: () => Rx.Observable.of(view)},
      updateShopProfile: {update: () => Rx.Observable.of(aggregate)}
    });
    const actions = [];
    epic(Rx.Observable.of(
      {type: SHOP_PROFILE_REQUESTED},
      {type: SHOP_PROFILE_SAVE_REQUESTED, command: {nif: 'B12345674'}}
    )).subscribe(
      action => actions.push(action),
      error => done(error),
      () => {
        expect(snapshotted).to.equal(false);
        expect(actions.map(action => action.type)).to.deep.equal([SHOP_PROFILE_LOADED, SHOP_PROFILE_SAVED]);
        actions.forEach(action => {
          expect(action.profile).to.deep.equal({
            nif: 'B12345674',
            legalName: 'Ultramarinos Pérez SL',
            tradeName: 'Ultramarinos Pérez',
            street: 'Mayor 1',
            postalCode: '28001',
            city: 'Madrid',
            province: 'Madrid',
            country: 'ES',
            invoicingEnabled: true,
            issuer: view.issuer
          });
          expect(action.profile.snapshot).to.equal(undefined);
        });
        done();
      }
    );
  });

  it('stores the empty view as blank form fields', done => {
    const empty = new ShopProfileView();
    const epic = makeShopProfileEpic({
      getShopProfile: {getProfile: () => Rx.Observable.of(empty)},
      updateShopProfile: {update: () => Rx.Observable.empty()}
    });
    epic(Rx.Observable.of({type: SHOP_PROFILE_REQUESTED})).subscribe(
      action => {
        expect(action.type).to.equal(SHOP_PROFILE_LOADED);
        expect(action.profile).to.deep.equal({
          nif: '',
          legalName: '',
          tradeName: '',
          street: '',
          postalCode: '',
          city: '',
          province: '',
          country: 'ES',
          invoicingEnabled: false,
          issuer: null
        });
      },
      error => done(error),
      () => done()
    );
  });
});
