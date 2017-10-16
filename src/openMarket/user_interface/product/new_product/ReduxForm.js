import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form';
import {required, maxLength15, number, greaterThan0, greaterOrEqualsThan0} from '../../validations/formValidations';

class ReduxForm extends Component {

  renderInput = field => (
    <div>
      <label htmlFor={field.placeholder}>{field.placeholder}</label>
      <input {...field.input} type={field.type} readOnly={field.readOnly}/>
      {field.meta.touched &&
      field.meta.error &&
      <span className="error">{field.meta.error}</span>}
    </div>
  );

  renderTextarea = field => (
    <div>
      <label htmlFor={field.placeholder}>{field.placeholder}</label>
      <textarea {...field.input} />
      {field.meta.touched &&
      field.meta.error &&
      <span className="error">{field.meta.error}</span>}
    </div>
  );


  render() {
    const { handleSubmit, edition, statusesList, submitting, categoriesList } = this.props;
    return (
      <form onSubmit={handleSubmit} onKeyPress={event => {if (event.which === 13 /* Enter */) { event.preventDefault();}}}>
        <Field name="barcode" readOnly={edition} component={this.renderInput} type="text" placeholder="Barcode" validate={[required, maxLength15]}/>
        <div>
          <Field name="name" component={this.renderInput} type="text" placeholder="Name" validate={required}/>
          <Field name="description" component={this.renderTextarea} placeholder="Description"/>
          <Field name="price" component={this.renderInput} type="text" placeholder="Price" validate={[required, greaterThan0, number]}/>
          <Field name="basePrice" component={this.renderInput} type="text" placeholder="Base Price" validate={[required, greaterThan0, number]}/>
          <Field name="stock" component={this.renderInput} type="text" placeholder="Stock" validate={[required, greaterOrEqualsThan0, number]}/>
          <Field name="stockMin" component={this.renderInput} type="text" placeholder="Stock Minimum" validate={[required, greaterThan0, number]}/>
          <Field name="weighted" component={this.renderInput} type="checkbox" placeholder="Weighted"/>
          <div>
            <div>
              <label htmlFor="categoryId">Category</label>
              <div className="SelectContainer">
                <Field name="categoryId" component="select" validate={[required]}>
                  <option value="">Select a category...</option>
                  {categoriesList.map(category =>
                    <option value={category.id} key={category.id}>{category.name}</option>
                  )}
                </Field>
              </div>
            </div>
            {edition &&
              <div>
                <label htmlFor="status">Status</label>
                <div className="SelectContainer">
                  <Field name="status" component="select">
                    <option value="">Select an status...</option>
                    {statusesList.map(status =>
                      <option value={status.key} key={status.key}>{status.value}</option>
                    )}
                  </Field>
                </div>
              </div>
            }
          </div>

          <button type="submit" disabled={submitting}>
            <i className="fa fa-floppy-o" />
            Save
          </button>
        </div>
      </form>
    );
  }
}

export default reduxForm({
  form: 'new_product',
  enableReinitialize : true
})(ReduxForm);


