// @flow
import React, { Component } from 'react';
import Dialog from '../dialog/ReduxConnector';

export default class App extends Component {
  props: {
    children: HTMLElement
  };

  render() {
    return (
      <div>
        {this.props.children}
        <Dialog/>
      </div>
    );
  }
}
