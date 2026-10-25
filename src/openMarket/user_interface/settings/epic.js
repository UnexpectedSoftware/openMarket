import * as Rx from 'rxjs';
import 'rxjs/add/observable/merge';
import OpenMarket from '../../application/index';
import {makeSettingsLoadEpic, makeSettingsSaveEpic} from './epicFactory';

const getShopProfile = OpenMarket.get('shop_get_profile_use_case');
const updateShopProfile = OpenMarket.get('shop_update_profile_use_case');
const getSellPreferences = OpenMarket.get('sell_get_preferences_use_case');
const updateSellPreferences = OpenMarket.get('sell_update_preferences_use_case');
const changeTheme = OpenMarket.get('appearance_change_theme_use_case');

export default (action$, store) =>
  Rx.Observable.merge(
    makeSettingsLoadEpic(getShopProfile, getSellPreferences)(action$, store),
    makeSettingsSaveEpic({
      updateShopProfile,
      updateSellPreferences,
      changeTheme,
      getShopProfile,
      getSellPreferences
    })(action$, store)
  );
