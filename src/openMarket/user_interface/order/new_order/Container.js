// @flow
import React, {Component} from 'react';
import {Link} from 'react-router';
import NewOrderReduxForm from './ReduxForm';
import WeightedDialog from '../weighted_dialog/ReduxConnector';
import PrinterDialog from '../printer_dialog/ReduxConnector';
import * as Rx from "rxjs";

class Container extends Component {

  handleSubmit = (values) => {
    const { newOrderSave , order } = this.props;
    newOrderSave(order);
  }

  handleKeyPress = (e) => {
    this.keyPressSubject$.next(e);
  }

  componentWillMount() {
    const { newOrderProductFetch } = this.props;
    this.keyPressSubject$ = new Rx.Subject();
    this.keyPressSubject$
      .map(event => ({key:event.key, value: event.target.value}))
      .filter(data => data.key === 'Enter')
      .map(data => newOrderProductFetch(data.value))
      .subscribe();
  }

  componentWillUnmount() {
    const { newOrderClosed } = this.props;
    newOrderClosed();
  }

  printOrder() {
    const { printOrderButtonClicked, order } = this.props;
    printOrderButtonClicked(order);
  }

  render() {
    const { order, readonly, newOrderProductQuantityChange, newOrderProductDeleted } = this.props;

    return (
      <div className="container-fluid">
        <h2>Let's {readonly ? 'edit an':'create a new'} order!</h2>
        <NewOrderReduxForm
          onDeleteProduct={newOrderProductDeleted}
          onQuantityChange={newOrderProductQuantityChange}
          onSubmit={this.handleSubmit}
          order={order}
          findProduct={this.handleKeyPress.bind(this)}
          printOrder={this.printOrder.bind(this)}
          readonly={readonly}
        />
        <WeightedDialog/>
        <PrinterDialog/>
      </div>
    );
  }
}

export default Container;
