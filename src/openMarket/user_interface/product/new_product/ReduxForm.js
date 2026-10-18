import React, {Component} from 'react';
import {Field, reduxForm} from 'redux-form';
import {required, maxLength15, number, greaterThan0, greaterOrEqualsThan0, vatRateCode} from '../../validations/formValidations';
import VatRate from '../../../domain/tax/VatRate';
import Button from '../../components/Button';
import ImageField from '../../components/ImageField';
import NumberField from '../../components/NumberField';
import Select from '../../components/Select';
import TextField from '../../components/TextField';
import reduxFormField from '../../components/reduxFormField';
import placeholder from '../../resources/category-placeholder.svg';

const textField = reduxFormField(TextField);
const numberField = reduxFormField(NumberField);
const selectField = reduxFormField(Select);

const STATUS_LABEL = {
  ENABLED: 'Activo',
  DISABLED: 'Desactivado'
};

function renderWeighted(field) {
  return (
    <div className="om-field om-field--check">
      <input
        id="weighted"
        name={field.input.name}
        type="checkbox"
        checked={!!field.input.value}
        onChange={field.input.onChange}
        onBlur={field.input.onBlur}
        onFocus={field.input.onFocus}
      />
      <label htmlFor="weighted">Weighted</label>
    </div>
  );
}

class ReduxForm extends Component {

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
    const {categoriesList, categoryId} = this.props;
    const selected = (categoriesList || []).filter(category => String(category.id) === String(categoryId || ''))[0];
    return (selected && selected.imageSrc) || placeholder;
  }

  render() {
    const {handleSubmit, edition, statusesList, submitting, categoriesList, initialValues, imageLookup, onFindImage} = this.props;
    const lookingUp = Boolean(imageLookup && imageLookup.busy);
    const statusOptions = (statusesList || []).map(status => ({
      value: status.key,
      label: STATUS_LABEL[status.key] || status.value
    }));
    const vatOptions = VatRate.options().map(option => ({
      value: option.code,
      label: option.label
    }));
    const categoryOptions = [{value: '', label: 'Select a category...'}].concat(
      (categoriesList || []).map(category => ({value: category.id, label: category.name}))
    );
    return (
      <form className="product-form" onSubmit={handleSubmit(this.attachImage)} onKeyPress={event => { if (event.which === 13) { event.preventDefault(); } }}>
        <div className="product-form-grid">
          <section className="product-block">
            <h3>General information</h3>
            <div className="product-fields">
              <Field name="name" component={textField} label="Name" validate={required} />
              <Field name="barcode" readOnly={edition} component={textField} label="Barcode" validate={[required, maxLength15]} />
            </div>
            <Field name="description" component={textField} label="Description" multiline />
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
                <Button
                  type="button"
                  variant="secondary"
                  className="product-image-lookup"
                  busy={lookingUp}
                  icon="search"
                  onClick={onFindImage}
                >
                  {lookingUp ? 'Looking…' : 'Find image'}
                </Button>
              }
            </div>
            <div className="product-fields">
              <Field name="weighted" component={renderWeighted} />
              <Field
                name="status"
                component={selectField}
                label="Status"
                options={statusOptions}
              />
            </div>
          </section>

          <div className="product-form-side">
            <section className="product-block">
              <h3>Pricing & Stock</h3>
              <div className="product-fields">
                <Field name="price" component={numberField} label="Price" unit="€" validate={[required, greaterThan0, number]} />
                <Field name="basePrice" component={numberField} label="Base Price" unit="€" validate={[required, greaterThan0, number]} />
              </div>
              <Field
                name="vatRate"
                component={selectField}
                label="IVA"
                options={vatOptions}
                validate={[required, vatRateCode]}
              />
              <div className="product-fields">
                <Field name="stock" component={numberField} label="Stock" validate={[required, greaterOrEqualsThan0, number]} />
                <Field name="stockMin" component={numberField} label="Stock Minimum" validate={[required, greaterThan0, number]} />
              </div>
            </section>

            <section className="product-block">
              <h3>Category</h3>
              <div className="product-category-row">
                <Field
                  name="categoryId"
                  component={selectField}
                  label="Category"
                  options={categoryOptions}
                  validate={[required]}
                />
                <img src={this.categoryImage()} alt="" />
              </div>
            </section>
          </div>
        </div>

        <div className="product-form-actions">
          <Button type="submit" icon="floppy-o" disabled={submitting}>Save</Button>
        </div>
      </form>
    );
  }
}

export default reduxForm({
  form: 'new_product',
  enableReinitialize: true
})(ReduxForm);
