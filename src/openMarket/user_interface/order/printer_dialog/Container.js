// @flow
import React, {Component} from 'react';

class Container extends Component {

  constructor(props,context) {
    super(props, context);
    this.closeDialog = this.closeDialog.bind(this);
  }

  closeDialog(e){
    const { dialogHide } = this.props;
    dialogHide();
  }

  handleOK = (values) => {
    const { hidePrinterDialog, printerDialog } = this.props;
    hidePrinterDialog({order:printerDialog.order,print:true});
  }

  handleKO = (values) => {
    const { hidePrinterDialog, printerDialog } = this.props;
    hidePrinterDialog({order:printerDialog.order,print:false});
  }


  render() {
    const { printerDialog } = this.props;
    if(!printerDialog.visible) return null;
    return (
      <div className="dialog-Modal">
        <div className="dialog-ModalControlX">
          <div className="dialog-ModalControlY">
            <div className="dialog-ModalContainer">
              <div className="dialog-Modal-header">
                <h2>Do you want a ticket?!</h2>
                <a className="close" onClick={this.closeDialog}>Close</a>
              </div>
              <div className="dialog-Modal-main">
                <button onClick={this.handleKO}>NO</button>
                <button onClick={this.handleOK}>YES!</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Container;
