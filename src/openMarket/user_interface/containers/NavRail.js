import React, {Component} from 'react';
import {Link, withRouter} from 'react-router';

/** Spanish labels live here until the i18n layer (OM-25) exists. */
export const NAV_ITEMS = [
  {label: 'Vender', to: '/create_order', icon: 'fa-shopping-basket', shortcut: 'F2'},
  {label: 'Pedidos', to: '/list_orders', icon: 'fa-list-alt', shortcut: 'F3'},
  {label: 'Productos', to: '/list_products', icon: 'fa-cube', shortcut: 'F4'},
  {label: 'Categorías', to: '/categories', icon: 'fa-tags'},
  {
    label: 'Informes',
    to: '/',
    icon: 'fa-bar-chart',
    indexOnly: true,
    secondary: {label: 'Takings', to: '/takings'}
  },
  {label: 'Plugins', to: '/plugins', icon: 'fa-plug'},
  {label: 'Ajustes', to: '/settings', icon: 'fa-cog', end: true}
];

/**
 * @param {string} key
 * @returns {string|null}
 */
export function routeForShortcut(key) {
  const item = NAV_ITEMS.find(entry => entry.shortcut === key);
  return item ? item.to : null;
}

/**
 * Global shortcut handler. Letter keys are ignored while typing.
 * F-keys still navigate.
 *
 * @param {{key: string, target?: {tagName?: string}, preventDefault: function(): void}} event
 * @param {(route: string) => void} navigate
 * @returns {boolean}
 */
export function handleNavShortcut(event, navigate) {
  const route = routeForShortcut(event.key);
  if (!route) {
    return false;
  }
  const tag = event.target && event.target.tagName;
  const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  if (typing && !/^F\d+$/.test(event.key)) {
    return false;
  }
  event.preventDefault();
  navigate(route);
  return true;
}

function RailLink({item, router, className}) {
  const active = router ? router.isActive(item.to, Boolean(item.indexOnly)) : false;
  const title = item.shortcut ? `${item.label} (${item.shortcut})` : item.label;
  return (
    <Link
      to={item.to}
      className={className}
      activeClassName="is-active"
      onlyActiveOnIndex={Boolean(item.indexOnly)}
      aria-current={active ? 'page' : null}
      title={title}
    >
      {item.icon ? <i className={`fa ${item.icon}`} aria-hidden="true" /> : null}
      <span>{item.label}</span>
    </Link>
  );
}

class NavRail extends Component {
  renderItem(item) {
    const {router} = this.props;
    return (
      <li key={item.to} className={item.end ? 'nav-rail-end' : null}>
        <RailLink item={item} router={router} className="nav-rail-link" />
        {item.secondary ? (
          <RailLink item={item.secondary} router={router} className="nav-rail-secondary" />
        ) : null}
      </li>
    );
  }

  render() {
    const primary = NAV_ITEMS.filter(item => !item.end);
    const end = NAV_ITEMS.filter(item => item.end);
    return (
      <nav className="nav-rail" aria-label="Principal">
        <ul className="nav-rail-list">
          {primary.map(item => this.renderItem(item))}
          {end.map(item => this.renderItem(item))}
        </ul>
      </nav>
    );
  }
}

export default withRouter(NavRail);
