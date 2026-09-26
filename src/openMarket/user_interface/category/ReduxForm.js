import React, {Component} from 'react';
import {Field, reduxForm} from 'redux-form';
import {required} from '../validations/formValidations';
import ImageField from '../components/ImageField';

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

  attachImage = (values) => {
    const chosen = this.imageField ? this.imageField.readChosenPath() : {imagePath: null};
    if (chosen.error) {
      return;
    }
    const payload = {name: values.name};
    if (chosen.imagePath) {
      payload.imagePath = chosen.imagePath;
    }
    this.props.onSubmit(payload);
  };

  render() {
    const { handleSubmit, submitting } = this.props;
    return (
      <form className="category-add" onSubmit={handleSubmit(this.attachImage)}>
        <p className="category-add-label">Add a category</p>
        <Field name="name" component={renderInput} type="text" placeholder="Name" validate={required}/>
        <ImageField
          inputId="category-image"
          ref={(node) => { this.imageField = node; }}
        />
        <button type="submit" disabled={submitting}>
          <i className="fa fa-floppy-o" />
          Save
        </button>
      </form>
    );
  }
}

export default reduxForm({
  form: 'categories'
})(ReduxForm);
