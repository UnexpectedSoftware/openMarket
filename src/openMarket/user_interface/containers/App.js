// @flow
import React, { Component } from 'react';
import {connect} from 'react-redux';
import Dialog from '../dialog/ReduxConnector';
import Navbar from "./Navbar";
import Notifications from "react-notification-system-redux";

class App extends Component {
  props: {
    children: HTMLElement
  };

  render() {
    const {notifications} = this.props;
    return (
      <div>
        <nav>
          <Navbar/>
        </nav>
        {this.props.children}
        <Dialog/>
        <Notifications notifications={notifications} />
      </div>
    );
  }
}

export default connect(
  state => ({ notifications: state.notifications })
)(App);
