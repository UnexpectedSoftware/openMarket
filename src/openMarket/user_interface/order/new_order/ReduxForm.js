import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form';
import ReactTable from 'react-table';
import * as Rx from "rxjs";

class ReduxForm extends Component {

  constructor(props,context) {
    super(props, context);
    this.renderEditable = this.renderEditable.bind(this);
    this.renderDeleteRow = this.renderDeleteRow.bind(this);
    this.changeQuantity = this.changeQuantity.bind(this);
    this.renderInput = this.renderInput.bind(this);
    this.setFocusOnBarcode = this.setFocusOnBarcode.bind(this);
    this.saveOrder = this.saveOrder.bind(this);
    this.subjectQuantity$ = new Rx.Subject();
    this.moneySymbol = "€";
    this.columns = [
      {
        Header: 'Barcode',
        accessor: 'barcode',
        show: false
      },
      {
        Header: 'Name',
        accessor: 'name'
      },
      {
        Header: 'Price',
        accessor: 'price',
        Cell: (data) => data.value +" "+this.moneySymbol
      },
      {
        Header: 'Quantity',
        accessor: 'quantity',
        Cell: this.renderEditable
      },
      {
        Header: 'Subtotal',
        accessor: 'subtotal',
        Cell: (data) => data.value +" "+this.moneySymbol
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        Cell: this.renderDeleteRow
      }
    ];
  }

  renderDeleteRow (data) {
    const { onDeleteProduct, readonly } = this.props;
    if(!readonly) {
      return (<a onClick={(e) => {
        onDeleteProduct(data.row.barcode);
        this.setFocusOnBarcode();
      }}>Delete</a>);
    }
  }

  renderEditable (props) {
    const {readonly} = this.props;
    return (<input type="text" readOnly={readonly} onChange={(e) => this.changeQuantity(e.target.value,props.row.barcode)} value={props.value} />);
  }

  setFocusOnBarcode () {
    const {readonly} = this.props;
    if(!readonly){
      this.barcodeInput.focus();
    }
  }

  changeQuantity(quantity,barcode){
    this.subjectQuantity$.next({quantityChanged: quantity, barcode: barcode});
  }

  saveOrder(e){
    const { handleSubmit} = this.props;
    handleSubmit(e);
    this.setFocusOnBarcode();
  }

  componentWillMount() {
    const { onQuantityChange } = this.props;
    this.subjectQuantity$
      .map(quantityChanged => onQuantityChange(quantityChanged))
      .subscribe();
  }

  componentDidMount() {
    this.setFocusOnBarcode();
  }


  renderInput = field => (
    <div>
      <label htmlFor={field.placeholder}>{field.placeholder}</label>
      <input ref={(input) => this.barcodeInput = input} {...field.input} type={field.type} onKeyPress={field.onkeypress}/>
      {field.meta.touched &&
      field.meta.error &&
      <span className="error">{field.meta.error}</span>}
    </div>
  );

  render() {
    const { order, readonly, findProduct, printOrder } = this.props;

    return (
      <form onKeyPress={event => {if (event.which === 13 /* Enter */) { event.preventDefault();}}}>
        {!readonly &&
          <Field name="barcode" component={this.renderInput} onkeypress={findProduct} type="text" placeholder="Barcode"/>
        }

        <ReactTable
          data={order.lines}
          columns={this.columns}
          showFilters={false}
          manual={true}
          showPagination={false}
          showPageSizeOptions={false}
        />
        <h2>{order.total+" "+this.moneySymbol} </h2>
        {!readonly &&
          <a className="button" onClick={this.saveOrder}>
            <i className="fa fa-floppy-o" />
            Save
          </a>
        }
        {readonly &&
        <a className="button" onClick={printOrder}>
          <i className="fa fa-print" />
          Print!
        </a>
        }
      </form>
    );
  }
}



export default reduxForm({
  form: 'new_order'
})(ReduxForm);


