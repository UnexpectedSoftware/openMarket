// @flow
import React, { Component } from 'react';
import Dialog from '../dialog/ReduxConnector';
import Navbar from "./Navbar";

export default class App extends Component {
  props: {
    children: HTMLElement
  };

  render() {
    return (
      <div>
        <nav>
          <Navbar/>
        </nav>
        {this.props.children}
        <Dialog/>
      </div>
    );
  }
}
