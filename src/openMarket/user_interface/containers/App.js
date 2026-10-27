import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Dialog from '../dialog/ReduxConnector';
import NavRail, {handleNavShortcut} from './NavRail';
import {shopMark} from './shopMark';
import {lowStockCountRequested} from '../low_stock/action';
import {shopProfileRequested} from '../settings/action';
import Notifications from 'react-notification-system-redux';
import Spinner from '../components/Spinner';
import {notificationStyle} from '../components/toast';

const TEXT_CONTROL = /^(?:INPUT|TEXTAREA|SELECT)$/;

/**
 * The sell search is a text control and may keep the focus it takes on open.
 * @param {Element | null} element
 * @returns {boolean}
 */
export function isTextControl(element) {
  return !!(element && element.tagName && TEXT_CONTROL.test(element.tagName));
}

/**
 * A focus that arrives before a click or a key is the window opening.
 * Text fields keep it. A link or button is cleared so it does not show a ring.
 * @param {Document} doc
 * @returns {boolean}
 */
export function clearLaunchFocus(doc) {
  const active = doc.activeElement;
  if (!active || active === doc.body || active === doc.documentElement) {
    return false;
  }
  if (isTextControl(active)) {
    return false;
  }
  active.blur();
  return true;
}

class App extends Component {
  constructor(props) {
    super(props);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.releaseLaunchFocus = this.releaseLaunchFocus.bind(this);
    this.onLaunchFocusIn = this.onLaunchFocusIn.bind(this);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown);
    document.documentElement.classList.add('om-suppress-focus');
    document.addEventListener('pointerdown', this.releaseLaunchFocus, true);
    document.addEventListener('mousedown', this.releaseLaunchFocus, true);
    document.addEventListener('keydown', this.releaseLaunchFocus, true);
    document.addEventListener('focusin', this.onLaunchFocusIn, true);
    clearLaunchFocus(document);
    const version = process.env.OPENMARKET_VERSION;
    if (version) {
      document.title = `OpenMarket ${version}`;
    }
    if (this.props.lowStockCountRequested) {
      this.props.lowStockCountRequested();
    }
    if (this.props.shopProfileRequested) {
      this.props.shopProfileRequested();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown);
    this.releaseLaunchFocus();
  }

  onKeyDown(event) {
    handleNavShortcut(event, route => {
      this.props.router.push(route);
    });
  }

  /**
   * The first click or key is the user, so focus rings work from then on.
   */
  releaseLaunchFocus() {
    document.documentElement.classList.remove('om-suppress-focus');
    document.removeEventListener('pointerdown', this.releaseLaunchFocus, true);
    document.removeEventListener('mousedown', this.releaseLaunchFocus, true);
    document.removeEventListener('keydown', this.releaseLaunchFocus, true);
    document.removeEventListener('focusin', this.onLaunchFocusIn, true);
  }

  onLaunchFocusIn() {
    clearLaunchFocus(document);
  }

  render() {
    const {notifications, children, shopName, initials} = this.props;
    return (
      <div className="app-shell">
        <div className="app-body">
          <NavRail
            lowStockCount={this.props.lowStockCount}
            shopName={shopName}
            initials={initials}
          />
          <main id="main" className="app-main">
            <JobProgress imageFetch={this.props.imageFetch} catalogPrint={this.props.catalogPrint} />
            {children}
          </main>
        </div>
        <Dialog />
        <Notifications notifications={notifications} style={notificationStyle} />
      </div>
    );
  }
}

/**
 * Long jobs keep a status line. It is absent when nothing is running, so the
 * screen still starts at the top of the window.
 * @param {{imageFetch?: {percent: number} | null, catalogPrint?: {percent: number} | null}} props
 */
export function JobProgress(props) {
  if (!props.imageFetch && !props.catalogPrint) {
    return null;
  }
  return (
    <div className="app-progress">
      {props.imageFetch ? (
        <span className="fetch-progress">
          <Spinner size="sm" label="Fetching images" />
          Fetching images {props.imageFetch.percent}%
        </span>
      ) : null}
      {props.catalogPrint ? (
        <span className="fetch-progress">
          <Spinner size="sm" label="Printing products" />
          Printing products {props.catalogPrint.percent}%
        </span>
      ) : null}
    </div>
  );
}

/**
 * @param {object} state
 */
export function mapStateToProps(state) {
  const saved = state.settings && state.settings.saved;
  const mark = shopMark(saved);
  return {
    notifications: state.notifications,
    imageFetch: state.imageFetch,
    catalogPrint: state.catalogPrint,
    lowStockCount: state.lowStock ? state.lowStock.count : null,
    shopName: mark.name,
    initials: mark.initials
  };
}

export default connect(
  mapStateToProps,
  dispatch => bindActionCreators({lowStockCountRequested, shopProfileRequested}, dispatch)
)(App);
