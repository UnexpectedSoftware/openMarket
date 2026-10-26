import {installDom} from '../components/domSetup';
import React from 'react';
import ReactDOM from 'react-dom';
import {expect} from 'chai';
import {createStore, applyMiddleware} from 'redux';
import {Provider} from 'react-redux';
import {Router, Route, IndexRoute, createMemoryHistory} from 'react-router';
import {routerMiddleware, syncHistoryWithStore} from 'react-router-redux';
import {rootReducer} from '../../../../openMarket/user_interface/reducers';
import App, {mapStateToProps, JobProgress} from '../../../../openMarket/user_interface/containers/App';
import {state} from '../../../../openMarket/user_interface/settings/model';
import {SHOP_PROFILE_REQUESTED} from '../../../../openMarket/user_interface/settings/action';
import {LOW_STOCK_COUNT_REQUESTED} from '../../../../openMarket/user_interface/low_stock/action';
import {mount} from '../components/mount';

function Child() {
  return <p className="shell-child">Pantalla</p>;
}

function settingsWith(profile) {
  const current = state();
  return {
    ...current,
    saved: {...current.saved, ...profile}
  };
}

describe('app shell', () => {
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
    document.title = '';
  });

  function renderShell(preloaded, seen) {
    const memoryHistory = createMemoryHistory();
    const record = () => next => action => {
      if (seen) {
        seen.push(action.type);
      }
      return next(action);
    };
    const store = createStore(
      rootReducer,
      preloaded,
      applyMiddleware(record, routerMiddleware(memoryHistory))
    );
    history = syncHistoryWithStore(memoryHistory, store);
    ReactDOM.render(
      <Provider store={store}>
        <Router history={history}>
          <Route path="/" component={App}>
            <IndexRoute component={Child} />
          </Route>
        </Router>
      </Provider>,
      host
    );
    return store;
  }

  it('starts at the top with the shop initials and no title bar', () => {
    const seen = [];
    renderShell({
      settings: settingsWith({
        tradeName: 'Ultramarinos Pérez',
        legalName: 'Ultramarinos Pérez SL'
      })
    }, seen);

    const mark = host.querySelector('.nav-rail-mark');
    expect(mark.textContent).to.equal('UP');
    expect(mark.getAttribute('aria-label')).to.equal('Ultramarinos Pérez');
    expect(host.querySelector('.nav-rail').firstChild).to.equal(mark);
    expect(host.querySelector('.header')).to.equal(null);
    expect(host.querySelector('.app-version')).to.equal(null);
    expect(host.querySelector('h1')).to.equal(null);
    expect(host.textContent).to.not.contain('OpenMarket');
    expect(host.querySelector('.app-progress')).to.equal(null);

    const skip = host.querySelector('.skip-link');
    expect(skip.getAttribute('href')).to.equal('#main');
    expect(skip.textContent).to.equal('Saltar al contenido');
    expect(skip.className).to.contain('om-visually-hidden');
    expect(host.querySelector('#main .shell-child').textContent).to.equal('Pantalla');
    expect(seen).to.include(SHOP_PROFILE_REQUESTED);
    expect(seen).to.include(LOW_STOCK_COUNT_REQUESTED);
  });

  it('uses OM when the shop has no name and keeps a running job out of a header', () => {
    renderShell({
      settings: settingsWith({tradeName: '  ', legalName: ''}),
      imageFetch: {percent: 40}
    });

    const mark = host.querySelector('.nav-rail-mark');
    expect(mark.textContent).to.equal('OM');
    expect(mark.getAttribute('aria-label')).to.equal('OpenMarket');
    expect(host.querySelector('.header')).to.equal(null);
    expect(host.querySelector('.app-version')).to.equal(null);
    const progress = host.querySelector('.app-progress');
    expect(progress.textContent).to.contain('Fetching images 40%');
    expect(host.querySelector('h1')).to.equal(null);
  });

  it('maps the saved shop onto the rail', () => {
    const mapped = mapStateToProps({
      notifications: [],
      imageFetch: null,
      catalogPrint: {percent: 12},
      lowStock: {count: 3},
      settings: settingsWith({legalName: 'Sol SL'})
    });
    expect(mapped.initials).to.equal('SS');
    expect(mapped.shopName).to.equal('Sol SL');
    expect(mapped.lowStockCount).to.equal(3);
    expect(mapped.catalogPrint).to.deep.equal({percent: 12});

    const missing = mapStateToProps({});
    expect(missing.initials).to.equal('OM');
    expect(missing.shopName).to.equal('OpenMarket');
    expect(missing.lowStockCount).to.equal(null);

    const view = mount(<JobProgress catalogPrint={{percent: 8}} />);
    expect(view.node.textContent).to.contain('Printing products 8%');
    expect(view.node.querySelector('.header')).to.equal(null);
    view.unmount();
    const idle = mount(<JobProgress />);
    expect(idle.node.querySelector('.app-progress')).to.equal(null);
    idle.unmount();
  });
});
