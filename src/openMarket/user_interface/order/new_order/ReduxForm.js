import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form';
import { required, maxLength15, number, minValue1 } from '../../validations/formValidations';
import ReactTable from 'react-table';

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
    this.columns = [
      {
        Header: 'Barcode',
        accessor: 'barcode'
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
        Cell: props => <span className='number'>{props.value}</span>
      }
    ];
  }

  renderEditable (cellInfo) {
    return (<div style={{ backgroundColor: '#fafafa' }} contentEditable onBlur={(e) => {
      console.log(e.target.textContent);
    }}>aaa</div>)
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
        <h1>{order.total}</h1>

        <button type="submit" disabled={submitting}>Save</button>
      </form>
    );
  }
}



export default reduxForm({
  form: 'new_order'
})(ReduxForm);


