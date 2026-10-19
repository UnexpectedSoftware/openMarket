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

const TILE = {
  barcode: '8400000000110',
  name: 'Arroz',
  priceCents: 200,
  vatRate: {kind: 'S1', percent: 21, cause: null},
  weighted: false,
  lowStock: false,
  imageUrl: null
};

describe('sell screen first open', () => {
  let host;
  let history;

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
    const productsQuery = {
      listForSale: () => {
        loads += 1;
        return Rx.Observable.of([TILE]);
      }
    };
    const memoryHistory = createMemoryHistory();
    const store = createStore(
      rootReducer,
      applyMiddleware(
        routerMiddleware(memoryHistory),
        createEpicMiddleware(makeSaleTilesEpic(productsQuery))
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
});

/**
 * @param {HTMLElement} node
 * @returns {string[]}
 */
function tileNames(node) {
  return Array.prototype.map.call(node.querySelectorAll('.sell-tile-name'), element => element.textContent);
}
