// @flow
import React, { Component } from 'react';
import { Link } from 'react-router';
import NewOrderReduxForm from './ReduxForm';
import WeightedDialog from '../weighted_dialog/ReduxConnector';
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

  render() {
    const { order, newOrderProductQuantityChange, newOrderProductDeleted, newOrderProductFetched } = this.props;

    return (
      <div>
        <p>Let's create a new order!</p>
        <NewOrderReduxForm
          onDeleteProduct={newOrderProductDeleted}
          onQuantityChange={newOrderProductQuantityChange}
          onSubmit={this.handleSubmit}
          order={order}
          findProduct={this.handleKeyPress.bind(this)}
        />
          <p>
            <Link to="/">
              <i className="fa fa-arrow-left fa-3x" />
            </Link>
          </p>
          <WeightedDialog
            productFetched={newOrderProductFetched}
          />
      </div>
    );
  }
}

export default Container;
