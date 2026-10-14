import OpenMarket from '../../application/index';
import {makePluginsEpic} from './epicFactory';

export default makePluginsEpic({
  listPlugins: OpenMarket.get('plugins_list_use_case'),
  savePlugin: OpenMarket.get('plugins_save_use_case')
});
