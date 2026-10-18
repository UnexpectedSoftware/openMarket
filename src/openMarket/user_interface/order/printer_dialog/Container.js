import React, {Component} from 'react';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';

class Container extends Component {

  constructor(props, context) {
    super(props, context);
    this.handleOK = this.handleOK.bind(this);
    this.handleKO = this.handleKO.bind(this);
  }

  handleOK() {
    const {hidePrinterDialog, printerDialog} = this.props;
    hidePrinterDialog({order: printerDialog.order, print: true});
  }

  handleKO() {
    const {hidePrinterDialog, printerDialog} = this.props;
    hidePrinterDialog({order: printerDialog.order, print: false});
  }

  render() {
    const {printerDialog} = this.props;
    const visible = !!(printerDialog && printerDialog.visible);
    return (
      <Dialog
        open={visible}
        title="Do you want a ticket?!"
        onClose={this.handleKO}
        actions={visible ? (
          <span className="om-gallery-row">
            <Button type="button" onClick={this.handleOK}>YES!</Button>
            <Button type="button" variant="secondary" onClick={this.handleKO}>NO</Button>
          </span>
        ) : null}
      />
    );
  }
}

export default Container;
