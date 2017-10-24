// @flow
import React, {Component} from 'react';
import NewProductDialogForm from './ReduxForm'

class Container extends Component {

  constructor(props,context) {
    super(props, context);
    this.closeDialog = this.closeDialog.bind(this);
  }

  handleSubmit = (values) => {
    const { newProductSaveButtonClickedDialog } = this.props;
    newProductSaveButtonClickedDialog(
      {
        barcode:values.barcode,
        name:values.name,
        price:values.price
      });
  }

  closeDialog(e){
    const { hideNewProductDialog } = this.props;
    hideNewProductDialog();
  }

  render() {
    const { newProductDialog } = this.props;
    if(!newProductDialog.visible) return null;
    return (
      <div className="dialog-Modal">
        <div className="dialog-ModalControlX">
          <div className="dialog-ModalControlY">
            <div className="dialog-ModalContainer">
              <div className="dialog-Modal-header">
                <h2>Product not found!, Do you want to create it just now? <a className="close" onClick={this.closeDialog}><i className="fa fa-times"></i></a></h2>
              </div>
              <div className="dialog-Modal-main">
                <NewProductDialogForm
                  initialValues={newProductDialog.initialValues}
                  onSubmit={this.handleSubmit}
                  close={this.closeDialog}
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
