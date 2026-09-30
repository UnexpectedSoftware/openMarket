import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form';
import {required, maxLength15, number, greaterThan0, greaterOrEqualsThan0} from '../../validations/formValidations';
import ImageField from '../../components/ImageField';
import placeholder from '../../resources/category-placeholder.svg';

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


  attachImage = (values) => {
    const chosen = this.imageField ? this.imageField.readChosenPath() : {imagePath: null};
    if (chosen.error) {
      return;
    }
    const payload = {...values};
    if (chosen.imagePath) {
      payload.imagePath = chosen.imagePath;
    }
    this.props.onSubmit(payload);
  };

  categoryImage() {
    const { categoriesList, categoryId } = this.props;
    const selected = (categoriesList || []).filter(category => String(category.id) === String(categoryId || ''))[0];
    return (selected && selected.imageSrc) || placeholder;
  }

  render() {
    const { handleSubmit, edition, statusesList, submitting, categoriesList, initialValues, imageLookup, onFindImage } = this.props;
    const lookingUp = Boolean(imageLookup && imageLookup.busy);
    return (
      <form className="product-form" onSubmit={handleSubmit(this.attachImage)} onKeyPress={event => {if (event.which === 13 /* Enter */) { event.preventDefault();}}}>
        <div className="product-form-grid">
          <section className="product-block">
            <h3>General information</h3>
            <div className="product-fields">
              <Field name="name" component={this.renderInput} type="text" placeholder="Name" validate={required}/>
              <Field name="barcode" readOnly={edition} component={this.renderInput} type="text" placeholder="Barcode" validate={[required, maxLength15]}/>
            </div>
            <Field name="description" component={this.renderTextarea} placeholder="Description"/>
            <div className="product-image-row">
              <div className="product-image-field">
                <ImageField
                  inputId="product-image"
                  currentSrc={initialValues && initialValues.imageSrc}
                  remoteSrc={imageLookup && imageLookup.imageSrc}
                  remotePath={imageLookup && imageLookup.imagePath}
                  ref={(node) => { this.imageField = node; }}
                />
              </div>
              {!edition &&
                <button type="button" className="product-image-lookup" disabled={lookingUp} onClick={onFindImage}>
                  <i className={lookingUp ? 'fa fa-spinner fa-spin' : 'fa fa-search'} />
                  {lookingUp ? 'Looking…' : 'Find image'}
                </button>
              }
            </div>
            <div className="product-fields">
              <Field name="weighted" component={this.renderInput} type="checkbox" placeholder="Weighted"/>
              <div>
                <label htmlFor="status">Status</label>
                <div className="SelectContainer">
                  <Field name="status" component="select">
                    {statusesList.map(status =>
                      <option value={status.key} key={status.key}>{status.value}</option>
                    )}
                  </Field>
                </div>
              </div>
            </div>
          </section>

          <div className="product-form-side">
            <section className="product-block">
              <h3>Pricing & Stock</h3>
              <div className="product-fields">
                <Field name="price" component={this.renderInput} type="text" placeholder="Price" validate={[required, greaterThan0, number]}/>
                <Field name="basePrice" component={this.renderInput} type="text" placeholder="Base Price" validate={[required, greaterThan0, number]}/>
              </div>
              <div className="product-fields">
                <Field name="stock" component={this.renderInput} type="text" placeholder="Stock" validate={[required, greaterOrEqualsThan0, number]}/>
                <Field name="stockMin" component={this.renderInput} type="text" placeholder="Stock Minimum" validate={[required, greaterThan0, number]}/>
              </div>
            </section>

            <section className="product-block">
              <h3>Category</h3>
              <div className="product-category-row">
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
                <img src={this.categoryImage()} alt="" />
              </div>
            </section>
          </div>
        </div>

        <div className="product-form-actions">
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
