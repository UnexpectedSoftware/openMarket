// @flow
import React, {Component} from 'react';
import {Link} from 'react-router';
import WeightedDialogForm from './ReduxForm';

class Container extends Component {

  constructor(props,context) {
    super(props, context);
  }

  handleSubmit = (values) => {
    const { hideWeightedDialog, weightedDialog } = this.props;
    hideWeightedDialog({product:weightedDialog.product,quantity:values.quantity});
  }


  render() {
    const { weightedDialog } = this.props;
    if(!weightedDialog.visible) return null;
    return (
      <div className="dialog-Modal">
        <div className="dialog-ModalControlX">
          <div className="dialog-ModalControlY">
            <div className="dialog-ModalContainer">
              <div className="dialog-Modal-header">
                <h2>Weight!</h2>
              </div>
              <div className="dialog-Modal-main">
                <WeightedDialogForm
                  onSubmit={this.handleSubmit}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Container;
