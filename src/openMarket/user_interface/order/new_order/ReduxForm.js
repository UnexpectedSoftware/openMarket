import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form';
import ReactTable from 'react-table';
import * as Rx from "rxjs";

const renderInput = field => (
  <div>
    <label htmlFor={field.placeholder}>{field.placeholder}</label>
    <input {...field.input} type={field.type} onKeyPress={field.onkeypress}/>
    {field.meta.touched &&
    field.meta.error &&
    <span className="error">{field.meta.error}</span>}
  </div>
);

class ReduxForm extends Component {

  constructor(props,context) {
    super(props, context);
    this.renderEditable = this.renderEditable.bind(this);
    this.changeQuantity = this.changeQuantity.bind(this);
    this.subjectQuantity$ = new Rx.Subject();
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
        accessor: 'price'
      },
      {
        Header: 'Quantity',
        accessor: 'quantity',
        Cell: this.renderEditable
      },
      {
        Header: 'Subtotal',
        accessor: 'subtotal'
      }
    ];
  }

  renderEditable (props) {
    return (<input type="text" onChange={(e) => this.changeQuantity(e.target.value,props.row.barcode)} value={props.value} />);
  }

  changeQuantity(quantity,barcode){
    console.log(quantity,barcode);
    this.subjectQuantity$.next({quantityChanged: quantity, barcode: barcode});
  }

  componentWillMount() {
    const { onQuantityChange } = this.props;
    this.subjectQuantity$
      .map(quantityChanged => onQuantityChange(quantityChanged))
      .subscribe();

  }

  render() {
    const { handleSubmit, order, submitting, findProduct } = this.props;

    return (
      <form onSubmit={handleSubmit}>

        <Field name="barcode" component={renderInput} onkeypress={findProduct} type="text" placeholder="Barcode"/>

        <ReactTable
          data={order.lines}
          columns={this.columns}
          showFilters={false}
          manual={true}
          showPagination={false}
          showPageSizeOptions={false}
        />
        <h1>{order.total} €</h1>

        <button type="submit" disabled={submitting}>Save</button>
      </form>
    );
  }
}



export default reduxForm({
  form: 'new_order'
})(ReduxForm);


