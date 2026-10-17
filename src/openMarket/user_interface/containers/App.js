import React, {Component} from 'react';
import {connect} from 'react-redux';
import Dialog from '../dialog/ReduxConnector';
import NavRail, {handleNavShortcut} from './NavRail';
import Notifications from 'react-notification-system-redux';

const notificationStyle = {
  Title: {
    warning: {
      color: 'var(--om-color-warning)'
    }
  },
  NotificationItem: {
    warning: {
      borderTop: '2px solid var(--om-color-warning)'
    }
  }
};

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
    const {notifications, imageFetch, catalogPrint, children} = this.props;
    const version = process.env.OPENMARKET_VERSION;
    return (
      <div className="app-shell">
        <header className="header">
          <a className="skip-link" href="#main" onClick={this.skipToContent}>
            Saltar al contenido
          </a>
          <h1>OpenMarket</h1>
          <span className="header-aside">
            {imageFetch ? (
              <span className="fetch-progress">
                <span className="fetch-progress-spinner" />
                Fetching images {imageFetch.percent}%
              </span>
            ) : null}
            {catalogPrint ? (
              <span className="fetch-progress">
                <span className="fetch-progress-spinner" />
                Printing products {catalogPrint.percent}%
              </span>
            ) : null}
            {version ? <span className="app-version">{version}</span> : null}
          </span>
        </header>
        <div className="app-body">
          <NavRail />
          <main id="main" className="app-main" tabIndex="-1">
            {children}
          </main>
        </div>
        <Dialog />
        <Notifications notifications={notifications} style={notificationStyle} />
      </div>
    );
  }
}

export default connect(
  state => ({
    notifications: state.notifications,
    imageFetch: state.imageFetch,
    catalogPrint: state.catalogPrint
  })
)(App);
