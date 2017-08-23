// @flow
import React, { Component } from 'react';
import { Link } from 'react-router';
import WeightedDialogForm from './ReduxForm';
class Container extends Component {

  constructor(props,context) {
    super(props, context);
    this.closeDialog = this.closeDialog.bind(this);
  }

  closeDialog(e){
    const { dialogHide } = this.props;
    dialogHide();
  }

  handleSubmit = (values) => {
    const { hideWeightedDialog, weightedDialog } = this.props;
    hideWeightedDialog({product:weightedDialog.product,quantity:values.quantity});
  }


  render() {
    const { weightedDialog } = this.props;
    if(!weightedDialog.visible) return null;
    return (
      <div className="dialog-modal">
        <h1>Weight!</h1>
        <WeightedDialogForm
          onSubmit={this.handleSubmit}
        />
      </div>
    );
  }
}

export default Container;
