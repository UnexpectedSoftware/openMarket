import React, {Component} from 'react';
import Dialog from '../../components/Dialog';
import WeightedDialogForm from './ReduxForm';

class Container extends Component {

  constructor(props, context) {
    super(props, context);
    this.quantityFocus = {current: null};
    this.handleSubmit = this.handleSubmit.bind(this);
    this.cancel = this.cancel.bind(this);
    this.setQuantityNode = this.setQuantityNode.bind(this);
  }

  handleSubmit(values) {
    const {hideWeightedDialog, weightedDialog} = this.props;
    hideWeightedDialog({product: weightedDialog.product, quantity: values.quantity});
  }

  cancel() {
    this.props.cancelWeightedDialog();
  }

  setQuantityNode(node) {
    this.quantityFocus.current = node;
  }

  render() {
    const {weightedDialog} = this.props;
    const visible = !!(weightedDialog && weightedDialog.visible);
    return (
      <Dialog
        open={visible}
        title="Peso (kg)"
        onClose={this.cancel}
        initialFocusRef={this.quantityFocus}
      >
        {visible ? (
          <WeightedDialogForm
            quantityRef={this.setQuantityNode}
            onSubmit={this.handleSubmit}
          />
        ) : null}
      </Dialog>
    );
  }
}

export default Container;
