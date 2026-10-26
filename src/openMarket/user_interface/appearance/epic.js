import * as Rx from 'rxjs';
import 'rxjs/add/observable/merge';
import OpenMarket from '../../application/index';
import {makeAppearanceEpic, makeLayoutEpic} from './epicFactory';

const theme = makeAppearanceEpic({
  changeTheme: OpenMarket.get('appearance_change_theme_use_case')
});
const layout = makeLayoutEpic({
  changeLayout: OpenMarket.get('appearance_change_layout_use_case')
});

export default (action$, store) => Rx.Observable.merge(theme(action$, store), layout(action$, store));
