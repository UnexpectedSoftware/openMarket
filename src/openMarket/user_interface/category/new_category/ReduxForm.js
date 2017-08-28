import React, {Component} from 'react';
import {Field, reduxForm} from 'redux-form';
import {required} from '../../validations/formValidations';

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
    const { handleSubmit, submitting } = this.props;
    return (
      <form onSubmit={handleSubmit}>
        <Field name="name" component={renderInput} type="text" placeholder="Name" validate={required}/>
        <button type="submit" disabled={submitting}>Save</button>
      </form>
    );
  }
}

export default reduxForm({
  form: 'new_category'
})(ReduxForm);


