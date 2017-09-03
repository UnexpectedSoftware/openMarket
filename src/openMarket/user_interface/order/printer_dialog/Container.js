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
      <div className="dialog-modal">
        <h1>Do you want a ticket?!</h1>
        <button onClick={this.handleKO}>NO</button>
        <button onClick={this.handleOK}>YES!</button>
      </div>
    );
  }
}

export default Container;
