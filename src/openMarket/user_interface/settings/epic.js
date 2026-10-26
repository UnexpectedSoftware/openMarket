import * as Rx from 'rxjs';
import 'rxjs/add/observable/merge';
import OpenMarket from '../../application/index';
import {makeSettingsLoadEpic, makeSettingsSaveEpic, makeSettingsTestPrintEpic} from './epicFactory';

const getShopProfile = OpenMarket.get('shop_get_profile_use_case');
const updateShopProfile = OpenMarket.get('shop_update_profile_use_case');
const getSellPreferences = OpenMarket.get('sell_get_preferences_use_case');
const updateSellPreferences = OpenMarket.get('sell_update_preferences_use_case');
const getPrinterSettings = OpenMarket.get('shop_get_printer_use_case');
const updatePrinterSettings = OpenMarket.get('shop_update_printer_use_case');
const getLanguagePreferences = OpenMarket.get('shop_get_language_use_case');
const updateLanguagePreferences = OpenMarket.get('shop_update_language_use_case');
const printTestTicket = OpenMarket.get('shop_print_test_use_case');
const changeTheme = OpenMarket.get('appearance_change_theme_use_case');
const changeLayout = OpenMarket.get('appearance_change_layout_use_case');

export default (action$, store) =>
  Rx.Observable.merge(
    makeSettingsLoadEpic(
      getShopProfile,
      getSellPreferences,
      getPrinterSettings,
      getLanguagePreferences
    )(action$, store),
    makeSettingsSaveEpic({
      updateShopProfile,
      updateSellPreferences,
      updatePrinterSettings,
      updateLanguagePreferences,
      changeTheme,
      changeLayout,
      getShopProfile,
      getSellPreferences,
      getPrinterSettings,
      getLanguagePreferences
    })(action$, store),
    makeSettingsTestPrintEpic({
      updatePrinterSettings,
      printTestTicket
    })(action$, store)
  );
