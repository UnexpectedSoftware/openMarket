import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form';
import { validation } from './ReduxFormValidations';


const renderField = props => (
  <div>
    <label>{props.placeholder}</label>
    <div>
      <input {...props.input}/>
      {props.touched && props.error && <span>{props.error}</span>}
    </div>
  </div>
);

class ReduxForm extends Component {

  render() {
    const { error, handleSubmit, categoriesList, pristine, reset, submitting } = this.props;
    return (
      <form onSubmit={handleSubmit}>

        <Field name="barcode" component={renderField} type="text" placeholder="Barcode"/>


        <div>
          <label htmlFor="name">Name</label>
          <Field name="name" component="input" type="text"/>
        </div>
        <div>
          <label htmlFor="description">Description</label>
          <Field name="description" component="textarea" type="text"/>
        </div>


        <Field name="price" component={renderField} type="text" placeholder="Price"/>

        <div>
          <label htmlFor="basePrice">Base price</label>
          <Field name="basePrice" component="input" type="text"/>
        </div>
        <div>
          <label htmlFor="stock">Stock</label>
          <Field name="stock" component="input" type="text"/>
        </div>
        <div>
          <label htmlFor="stockMin">Stock Minimum</label>
          <Field name="stockMin" component="input" type="text"/>
        </div>
        <div>
          <label htmlFor="imageUrl">Image url</label>
          <Field name="imageUrl" component="input" type="text"/>
        </div>
        <div>
          <label htmlFor="categoryId">Category</label>
          <Field name="categoryId" component="select">
            <option value="">Select a category...</option>
            {categoriesList.map(category =>
              <option value={category.id} key={category.id}>{category.name}</option>
            )}
          </Field>

        </div>

        <button type="submit">Submit</button>
      </form>
    );
  }
}

export default reduxForm({
  form: 'new_product',
  validation
})(ReduxForm);


