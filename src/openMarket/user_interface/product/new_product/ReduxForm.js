import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form';
import { required, maxLength15, number, greaterThan0 } from '../../validations/formValidations';

class ReduxForm extends Component {

  renderInput = field => (
    <div>
      <label htmlFor={field.placeholder}>{field.placeholder}</label>
      <input {...field.input} type={field.type}/>
      {field.meta.touched &&
      field.meta.error &&
      <span className="error">{field.meta.error}</span>}
    </div>
  );

  renderBarcode = field => {
    const { edition, loadProduct } = this.props;
    return (
      <div>
        <label htmlFor={field.placeholder}>{field.placeholder}</label>
        <input {...field.input} type={field.type}/>
        {field.meta.touched &&
        field.meta.error &&
        <span className="error">{field.meta.error}</span>}
        { edition &&
        <input type="button" value="loadProduct" onClick={loadProduct}/>
        }
      </div>
    );
  }

  renderFormDetails = () => {
    const { edition, categoriesList, statusesList, submitting, showUpdateFields } = this.props;
    if(!edition || (edition &&  showUpdateFields)) return (
      <div>
        <Field name="name" component={this.renderInput} type="text" placeholder="Name" validate={required}/>
        <Field name="description" component={this.renderInput} type="textarea" placeholder="Description"/>
        <Field name="price" component={this.renderInput} type="text" placeholder="Price" validate={[required, greaterThan0, number]}/>
        <Field name="basePrice" component={this.renderInput} type="text" placeholder="Base Price" validate={[required, greaterThan0, number]}/>
        <Field name="stock" component={this.renderInput} type="text" placeholder="Stock" validate={[required, greaterThan0, number]}/>
        <Field name="stockMin" component={this.renderInput} type="text" placeholder="Stock Minimum" validate={[required, greaterThan0, number]}/>
        <Field name="weighted" component={this.renderInput} type="checkbox" placeholder="Weighted"/>
          <div>
          <label htmlFor="categoryId">Category</label>
        <Field name="categoryId" component="select">
          <option value="">Select a category...</option>
          {categoriesList.map(category =>
            <option value={category.id} key={category.id}>{category.name}</option>
          )}
        </Field>
            {edition &&
            <Field name="status" component="select">
              <option value="">Select an status...</option>
              {statusesList.map(status =>
                <option value={status.key} key={status.key}>{status.name}</option>
              )}
            </Field>
            }
        </div>

        <button type="submit" disabled={submitting}>Save</button>
      </div>
    );
  }

  render() {
    const { handleSubmit } = this.props;
    return (
      <form onSubmit={handleSubmit}>
        <Field name="barcode" component={this.renderBarcode} type="text" placeholder="Barcode" validate={[required, maxLength15]}/>
        {this.renderFormDetails()}
      </form>
    );
  }
}

export default reduxForm({
  form: 'new_product',
  enableReinitialize : true
})(ReduxForm);


