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

const columns = [
  {
    header: 'Name',
    accessor: 'name',
    hideFilter: true
  },
  {
    header: 'Quantity',
    accessor: 'quantity',
    hideFilter: true
  },
  {
    header: 'Price',
    accessor: 'price',
    hideFilter: true
  }
];

class ReduxForm extends Component {

  render() {
    const { handleSubmit, order, submitting, findProduct } = this.props;
    return (
      <form onSubmit={handleSubmit}>

        <Field name="barcode" component={renderInput} onkeypress={findProduct} type="text" placeholder="Barcode"/>

        <ReactTable
          data={order.lines}
          columns={columns}
          showFilters={false}
          manual={true}
          showPagination={false}
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


