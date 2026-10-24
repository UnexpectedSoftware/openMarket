import {installDom} from '../../components/domSetup';
import React from 'react';
import ReactDOM from 'react-dom';
import {expect} from 'chai';
import {createStore, applyMiddleware} from 'redux';
import {Provider} from 'react-redux';
import {createEpicMiddleware} from 'redux-observable';
import {Router, Route, createMemoryHistory} from 'react-router';
import {routerMiddleware, syncHistoryWithStore, LOCATION_CHANGE} from 'react-router-redux';
import * as Rx from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/switchMap';
import {rootReducer} from '../../../../../openMarket/user_interface/reducers';
import {makeSaleTilesEpic} from '../../../../../openMarket/user_interface/order/new_order/epicFactory';
import OrderPage from '../../../../../openMarket/user_interface/order/new_order/ReduxConnector';
import {
  NEW_ORDER_PRODUCT_FETCHED,
  NEW_ORDER_SAVED,
  REPRINT_PREVIEW_LOADED
} from '../../../../../openMarket/user_interface/order/new_order/action';
import {SHOP_PROFILE_LOADED} from '../../../../../openMarket/user_interface/settings/action';

const TILE = {
  barcode: '8400000000110',
  name: 'Arroz',
  priceCents: 200,
  vat: {kind: 'S1', percent: 21, cause: null},
  weighted: false,
  lowStock: false,
  imageUrl: null
};

let history;

describe('sell screen first open', () => {
  let host;

  beforeEach(() => {
    installDom();
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    if (host) {
      ReactDOM.unmountComponentAtNode(host);
      if (host.parentNode) {
        host.parentNode.removeChild(host);
      }
    }
    if (history && history.unsubscribe) {
      history.unsubscribe();
    }
  });

  it('keeps the product tile when a POP follows the route push', () => {
    let loads = 0;
    const listProducts = {
      list: () => {
        loads += 1;
        return Rx.Observable.of({items: [TILE], total: 1});
      }
    };
    const memoryHistory = createMemoryHistory();
    const store = createStore(
      rootReducer,
      applyMiddleware(
        routerMiddleware(memoryHistory),
        createEpicMiddleware(makeSaleTilesEpic(listProducts))
      )
    );
    history = syncHistoryWithStore(memoryHistory, store);
    ReactDOM.render(
      <Provider store={store}>
        <Router history={history}>
          <Route path="/">
            <Route path="create_order" component={OrderPage} />
          </Route>
        </Router>
      </Provider>,
      host
    );

    history.push('/create_order');
    expect(loads).to.equal(1);
    expect(tileNames(host)).to.include('Arroz');

    const location = store.getState().routing.locationBeforeTransitions;
    store.dispatch({
      type: LOCATION_CHANGE,
      payload: Object.assign({}, location, {action: 'POP'})
    });

    expect(loads).to.equal(1);
    expect(tileNames(host)).to.include('Arroz');
    expect(host.textContent).to.not.contain('No hay productos');
  });

  it('keeps the product grid when a sale is cleared and answers the sell keys', () => {
    const store = mountSell(host);
    store.dispatch({
      type: SHOP_PROFILE_LOADED,
      profile: {
        issuer: {tradeName: 'Ultramarinos', legalName: 'Ultramarinos SL', nif: 'B12345678'}
      }
    });
    expect(host.textContent).to.contain('NIF B12345678');
    store.dispatch({
      type: SHOP_PROFILE_LOADED,
      profile: {issuer: {legalName: 'Solo legal'}}
    });
    expect(host.textContent).to.contain('Vender');
    store.dispatch({
      type: NEW_ORDER_PRODUCT_FETCHED,
      payload: {product: {barcode: '0001', name: 'Ninja', price: 1}, quantity: 1}
    });
    expect(host.textContent).to.contain('Ninja');
    ['F9', '+', '-', 'Delete', 'ArrowUp', 'ArrowDown', 'Escape', '?', 'a', 'F8'].forEach(press);
    press('Escape');
    press('F12');
    press('Escape');
    store.dispatch({type: NEW_ORDER_SAVED, payload: {id: 'sale-1'}});
    press('F9');
    store.dispatch({type: REPRINT_PREVIEW_LOADED, payload: '<p>ticket</p>'});
    expect(host.querySelector('.om-receipt-preview')).to.not.equal(null);
    expect(host.textContent).to.contain('El ticket está vacío');
    expect(tileNames(host)).to.include('Arroz');
  });
});

/**
 * @param {string} key
 */
function press(key) {
  document.dispatchEvent(new window.KeyboardEvent('keydown', {key, bubbles: true}));
}

/**
 * @param {HTMLElement} host
 * @returns {{dispatch: Function, getState: Function}}
 */
function mountSell(host) {
  const listProducts = {list: () => Rx.Observable.of({items: [TILE], total: 1})};
  const memoryHistory = createMemoryHistory();
  const store = createStore(
    rootReducer,
    applyMiddleware(
      routerMiddleware(memoryHistory),
      createEpicMiddleware(makeSaleTilesEpic(listProducts))
    )
  );
  history = syncHistoryWithStore(memoryHistory, store);
  ReactDOM.render(
    <Provider store={store}>
      <Router history={history}>
        <Route path="/">
          <Route path="create_order" component={OrderPage} />
        </Route>
      </Router>
    </Provider>,
    host
  );
  history.push('/create_order');
  return store;
}

/**
 * @param {HTMLElement} node
 * @returns {string[]}
 */
function tileNames(node) {
  return Array.prototype.map.call(node.querySelectorAll('.sell-tile-name'), element => element.textContent);
}
