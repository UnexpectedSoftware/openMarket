import OpenMarket from '../../application/index';
import {makeAppearanceEpic} from './epicFactory';

export default makeAppearanceEpic({
  changeTheme: OpenMarket.get('appearance_change_theme_use_case')
});
