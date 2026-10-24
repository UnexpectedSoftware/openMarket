import React from 'react';
import PropTypes from 'prop-types';

export function routerFor() {
  return {
    push() {},
    replace() {},
    go() {},
    goBack() {},
    goForward() {},
    setRouteLeaveHook() {
      return function unsubscribe() {};
    },
    isActive() {
      return false;
    },
    createHref(to) {
      if (typeof to === 'string') {
        return '#' + to;
      }
      const path = to && to.pathname ? to.pathname : '/';
      return '#' + path;
    }
  };
}

export default class RouterHarness extends React.Component {
  getChildContext() {
    return {router: this.props.router || routerFor()};
  }

  render() {
    return this.props.children;
  }
}

RouterHarness.childContextTypes = {
  router: PropTypes.object
};
