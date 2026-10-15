import OpenMarket from '../../application/index';
import {makeShopProfileEpic} from './epicFactory';

export default makeShopProfileEpic({
  getShopProfile: OpenMarket.get('shop_get_profile_use_case'),
  updateShopProfile: OpenMarket.get('shop_update_profile_use_case')
});
