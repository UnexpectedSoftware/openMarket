import React, {Component} from 'react';
import Button from '../components/Button';
import Dialog from '../components/Dialog';

/**
 * Asks before an empty category is removed. Esc and Cancelar leave the card.
 */
export default class CategoryDeleteDialog extends Component {

  constructor(props, context) {
    super(props, context);
    this.confirmRef = {current: null};
    this.setConfirm = this.setConfirm.bind(this);
  }

  setConfirm(node) {
    this.confirmRef.current = node ? node.querySelector('button') : null;
  }

  render() {
    const confirm = this.props.confirm;
    return (
      <Dialog
        open
        role="alertdialog"
        title={'¿Eliminar ' + confirm.name + '?'}
        initialFocusRef={this.confirmRef}
        onClose={this.props.onClose}
        actions={this.actions()}
      >
        <p className="category-delete-copy">Esta categoría no tiene productos.</p>
        {confirm.error ? <p className="category-dialog-error" role="alert">{confirm.error}</p> : null}
      </Dialog>
    );
  }

  actions() {
    return (
      <span className="category-dialog-actions">
        <Button variant="secondary" onClick={this.props.onClose}>Cancelar</Button>
        <span ref={this.setConfirm}>
          <Button variant="danger" onClick={this.props.onConfirm}>Eliminar</Button>
        </span>
      </span>
    );
  }
}
