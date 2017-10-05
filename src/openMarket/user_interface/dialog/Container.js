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
      <div className="dialog-Modal">
        <div className="dialog-ModalControlX">
          <div className="dialog-ModalControlY">
            <div className="dialog-ModalContainer">
              <div className="dialog-Modal-header">
                <h2>Warning!</h2>
                <a className="close" onClick={this.closeDialog}>Close</a>
              </div>
              <div className="dialog-Modal-main">
                <p>{ dialog.message }</p>
                <input type="button" value="CLOSE" onClick={this.closeDialog}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Container;
