// @flow
import React, { Component } from 'react';
import { Link } from 'react-router';

class Container extends Component {

  constructor(props,context) {
    super(props, context);
    this.closeDialog = this.closeDialog.bind(this);
  }

  closeDialog(e){
    const { dialogHide} = this.props;
    dialogHide();
  }


  render() {
    const { dialog } = this.props;
    if(!dialog.visible) return null;
    return (
      <div className="dialog-modal">
        <h1>Warning!</h1>
        <p>
          { dialog.message }
        </p>

        <input type="button" value="CLOSE" onClick={this.closeDialog}/>

      </div>
    );
  }
}

export default Container;
