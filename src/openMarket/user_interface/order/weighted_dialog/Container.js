import React, {Component} from 'react';
import Dialog from '../../components/Dialog';
import Money from '../../../domain/money/Money';
import {formatMoney} from '../../i18n/money';
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
    hideWeightedDialog({
      product: weightedDialog.product,
      quantity: values.quantity,
      replace: weightedDialog.replace
    });
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
    const product = weightedDialog && weightedDialog.product;
    const price = product ? Money.from(product.price == null ? 0 : product.price) : null;
    return (
      <Dialog
        open={visible}
        title="Peso (kg)"
        onClose={this.cancel}
        initialFocusRef={this.quantityFocus}
      >
        {visible ? (
          <div>
            <p className="sell-weigh-name">{product ? product.name : ''}</p>
            <p className="sell-weigh-price">{price ? formatMoney(price) + ' / kg' : ''}</p>
            <WeightedDialogForm
              quantityRef={this.setQuantityNode}
              onSubmit={this.handleSubmit}
              price={price}
              initialValues={weightedDialog.initialValues}
            />
          </div>
        ) : null}
      </Dialog>
    );
  }
}

export default Container;
