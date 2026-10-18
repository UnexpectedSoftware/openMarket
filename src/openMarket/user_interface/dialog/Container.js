import React, {Component} from 'react';
import Button from '../components/Button';
import Dialog from '../components/Dialog';

class Container extends Component {

  constructor(props, context) {
    super(props, context);
    this.closeDialog = this.closeDialog.bind(this);
  }

  closeDialog() {
    this.props.dialogHide();
  }

  render() {
    const {dialog} = this.props;
    return (
      <Dialog
        open={!!(dialog && dialog.visible)}
        role="alertdialog"
        title="Warning!"
        onClose={this.closeDialog}
        actions={<Button type="button" onClick={this.closeDialog}>CLOSE</Button>}
      >
        <p>{dialog && dialog.message}</p>
      </Dialog>
    );
  }
}

export default Container;
