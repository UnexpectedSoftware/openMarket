import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form';
import ReactTable from 'react-table';
import * as Rx from "rxjs";
import Button from "../../components/Button";
import {formatMoney} from "../../i18n/money";
import {vatLines} from "./model";

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
        Cell: (data) => formatMoney(data.value)
      },
      {
        Header: 'Quantity',
        accessor: 'quantity',
        Cell: this.renderEditable
      },
      {
        Header: 'Subtotal',
        accessor: 'subtotal',
        Cell: (data) => formatMoney(data.value)
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
    if (!readonly) {
      return (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            onDeleteProduct(data.row.barcode);
            this.setFocusOnBarcode();
          }}
        >
          Delete
        </Button>
      );
    }
    return null;
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
        <ul className="order-vat">
          {vatLines(order.lines).map(row =>
            <li key={row.label}>{row.label} {formatMoney(row.base)} {formatMoney(row.quota)}</li>
          )}
        </ul>
        <h3 className="order-total">
          <span>{formatMoney(order.total)}</span>
          {!readonly &&
            <Button type="button" icon="floppy-o" onClick={this.saveOrder}>Save</Button>
          }
          {readonly &&
            <Button type="button" variant="secondary" icon="print" onClick={printOrder}>Print!</Button>
          }
        </h3>
      </form>
    );
  }
}



export default reduxForm({
  form: 'new_order'
})(ReduxForm);


