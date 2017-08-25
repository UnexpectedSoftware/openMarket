import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form';
import { required, maxLength15, number, greaterThan0 } from '../../validations/formValidations';

const renderInput = field => (
  <div>
    <label htmlFor={field.placeholder}>{field.placeholder}</label>
    <input {...field.input} type={field.type}/>
    {field.meta.touched &&
    field.meta.error &&
    <span className="error">{field.meta.error}</span>}
  </div>
);

class ReduxForm extends Component {

  render() {
    const { handleSubmit, categoriesList, submitting, edition, loadProduct } = this.props;
    return (
      <form onSubmit={handleSubmit}>

        <Field name="barcode" component={renderInput} type="text" placeholder="Barcode" validate={[required, maxLength15]}/>
        { edition &&
          <input type="button" value="loadProduct" onClick={loadProduct}/>
        }
        <Field name="name" component={renderInput} type="text" placeholder="Name" validate={required}/>
        <Field name="description" component={renderInput} type="textarea" placeholder="Description"/>
        <Field name="price" component={renderInput} type="text" placeholder="Price" validate={[required, greaterThan0, number]}/>
        <Field name="basePrice" component={renderInput} type="text" placeholder="Base Price" validate={[required, greaterThan0, number]}/>
        <Field name="stock" component={renderInput} type="text" placeholder="Stock" validate={[required, greaterThan0, number]}/>
        <Field name="stockMin" component={renderInput} type="text" placeholder="Stock Minimum" validate={[required, greaterThan0, number]}/>
        <Field name="weighted" component={renderInput} type="checkbox" placeholder="Weighted"/>
        <div>
          <label htmlFor="categoryId">Category</label>
          <Field name="categoryId" component="select">
            <option value="">Select a category...</option>
            {categoriesList.map(category =>
              <option value={category.id} key={category.id}>{category.name}</option>
            )}
          </Field>

        </div>

        <button type="submit" disabled={submitting}>Save</button>
      </form>
    );
  }
}

export default reduxForm({
  form: 'new_product',
  enableReinitialize : true
})(ReduxForm);


