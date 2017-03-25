import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form';


class ProductForm extends Component {

  render() {
    const { handleSubmit, categories } = this.props;
    return (
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="barcode">Barcode</label>
          <Field name="barcode" component="input" type="text"/>
        </div>
        <div>
          <label htmlFor="name">Name</label>
          <Field name="name" component="input" type="text"/>
        </div>
        <div>
          <label htmlFor="description">Description</label>
          <Field name="description" component="textarea" type="text"/>
        </div>
        <div>
          <label htmlFor="price">Price</label>
          <Field name="price" component="input" type="text"/>
        </div>
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
            <option></option>
            <option value="42">Fruta</option>
          </Field>

        </div>

        <button type="submit">Submit</button>
      </form>
    );
  }
}

// Decorate the form component
export default reduxForm({
  form: 'new_product' // a unique name for this form
})(ProductForm);


