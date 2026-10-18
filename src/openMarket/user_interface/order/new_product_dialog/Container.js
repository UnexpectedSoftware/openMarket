import React, {Component} from 'react';
import Dialog from '../../components/Dialog';
import NewProductDialogForm from './ReduxForm';

class Container extends Component {

  constructor(props, context) {
    super(props, context);
    this.closeDialog = this.closeDialog.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(values) {
    this.props.newProductSaveButtonClickedDialog({
      barcode: values.barcode,
      name: values.name,
      price: values.price
    });
  }

  closeDialog() {
    this.props.hideNewProductDialog();
  }

  render() {
    const {newProductDialog} = this.props;
    const visible = !!(newProductDialog && newProductDialog.visible);
    return (
      <Dialog
        open={visible}
        title="Crear producto"
        onClose={this.closeDialog}
      >
        {visible ? (
          <NewProductDialogForm
            initialValues={newProductDialog.initialValues}
            onSubmit={this.handleSubmit}
            close={this.closeDialog}
          />
        ) : null}
      </Dialog>
    );
  }
}

export default Container;
