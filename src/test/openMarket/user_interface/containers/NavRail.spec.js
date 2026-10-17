import React from 'react';
import {expect} from 'chai';
import {renderToStaticMarkup} from 'react-dom/server';
import PropTypes from 'prop-types';
import NavRail, {NAV_ITEMS, handleNavShortcut, routeForShortcut} from '../../../../openMarket/user_interface/containers/NavRail';

function routerFor(pathname) {
  return {
    location: {pathname, search: '', query: {}, hash: '', state: null, action: 'POP'},
    params: {},
    routes: [],
    push() {},
    replace() {},
    go() {},
    goBack() {},
    goForward() {},
    setRouteLeaveHook() {
      return function unsubscribe() {};
    },
    isActive(to, indexOnly) {
      const path = typeof to === 'string' ? to : to.pathname;
      if (indexOnly || path === '/') {
        return pathname === path;
      }
      return pathname === path || pathname.indexOf(`${path}/`) === 0;
    },
    createHref(to) {
      const path = typeof to === 'string' ? to : to.pathname;
      return `#${path}`;
    }
  };
}

class RouterHarness extends React.Component {
  getChildContext() {
    return {router: this.props.router};
  }

  render() {
    return this.props.children;
  }
}

RouterHarness.childContextTypes = {
  router: PropTypes.object
};

function anchors(html) {
  const found = [];
  const pattern = /<a\b([^>]*)>/g;
  let match = pattern.exec(html);
  while (match) {
    const attrs = match[1];
    const hrefMatch = attrs.match(/href="([^"]*)"/);
    found.push({
      href: hrefMatch ? hrefMatch[1] : '',
      current: /aria-current="page"/.test(attrs)
    });
    match = pattern.exec(html);
  }
  return found;
}

function hrefs(html) {
  return anchors(html).map(anchor => anchor.href);
}

function currentHref(html) {
  const current = anchors(html).filter(anchor => anchor.current);
  expect(current).to.have.length(1);
  return current[0].href;
}

function renderAt(pathname) {
  return renderToStaticMarkup(
    <RouterHarness router={routerFor(pathname)}>
      <NavRail />
    </RouterHarness>
  );
}

describe('NavRail', () => {
  it('renders one link per destination', () => {
    const html = renderAt('/create_order');
    expect(hrefs(html)).to.deep.equal([
      '#/create_order',
      '#/list_orders',
      '#/list_products',
      '#/categories',
      '#/',
      '#/takings',
      '#/plugins',
      '#/settings'
    ]);
    NAV_ITEMS.forEach(item => {
      expect(html).to.contain(item.label);
    });
    expect(html).to.contain('Takings');
    expect(html).to.contain('aria-label="Principal"');
  });

  it('marks the active item for the current location', () => {
    expect(currentHref(renderAt('/list_orders'))).to.equal('#/list_orders');
    expect(currentHref(renderAt('/'))).to.equal('#/');
    expect(currentHref(renderAt('/takings'))).to.equal('#/takings');
    expect(currentHref(renderAt('/settings'))).to.equal('#/settings');
  });

  it('maps F2, F3 and F4 to routes, including while an input is focused', () => {
    expect(routeForShortcut('F2')).to.equal('/create_order');
    expect(routeForShortcut('F3')).to.equal('/list_orders');
    expect(routeForShortcut('F4')).to.equal('/list_products');
    expect(routeForShortcut('F1')).to.equal(null);

    const routes = [];
    const navigate = route => {
      routes.push(route);
    };
    expect(handleNavShortcut({
      key: 'F2',
      target: {tagName: 'INPUT'},
      preventDefault() {}
    }, navigate)).to.equal(true);
    expect(handleNavShortcut({
      key: 'F3',
      target: {tagName: 'TEXTAREA'},
      preventDefault() {}
    }, navigate)).to.equal(true);
    expect(handleNavShortcut({
      key: 'F4',
      target: {tagName: 'BODY'},
      preventDefault() {}
    }, navigate)).to.equal(true);
    expect(handleNavShortcut({
      key: 'a',
      target: {tagName: 'INPUT'},
      preventDefault() {}
    }, navigate)).to.equal(false);
    expect(routes).to.deep.equal(['/create_order', '/list_orders', '/list_products']);
  });
});
