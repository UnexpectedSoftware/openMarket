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

class App extends Component {
  constructor(props) {
    super(props);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.skipToContent = this.skipToContent.bind(this);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown);
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
  }

  onKeyDown(event) {
    handleNavShortcut(event, route => {
      this.props.router.push(route);
    });
  }

  skipToContent(event) {
    event.preventDefault();
    const main = document.getElementById('main');
    if (main) {
      main.focus();
    }
  }

  render() {
    const {notifications, children, shopName, initials} = this.props;
    return (
      <div className="app-shell">
        <a className="skip-link om-visually-hidden" href="#main" onClick={this.skipToContent}>
          Saltar al contenido
        </a>
        <div className="app-body">
          <NavRail
            lowStockCount={this.props.lowStockCount}
            shopName={shopName}
            initials={initials}
          />
          <main id="main" className="app-main" tabIndex="-1">
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
