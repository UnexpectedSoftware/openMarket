import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form';
import {greaterThan0, number, required} from "../../validations/formValidations";

class ReduxForm extends Component {

  constructor(props,context) {
    super(props, context);
    this.renderInput = this.renderInput.bind(this);
    this.save = this.save.bind(this);
  }

  save(e){
    const { handleSubmit} = this.props;
    handleSubmit(e);
  }

  renderInput = field => (
    <div>
      <label htmlFor={field.placeholder}>{field.placeholder}</label>
      <input ref={(input) => this.quantityInput = input} {...field.input} type={field.type} onKeyPress={field.onkeypress}/>
      {field.meta.touched &&
      field.meta.error &&
      <span className="error">{field.meta.error}</span>}
    </div>
  );

  render() {
    const {close} = this.props;
    return (
      <form onKeyPress={event => {if (event.which === 13 /* Enter */) { event.preventDefault();}}}>

        <Field name="barcode" component={this.renderInput} type="text" placeholder="Barcode" validate={[required]}/>
        <Field name="name" component={this.renderInput} type="text" placeholder="Name" validate={required}/>
        <Field name="price" component={this.renderInput} type="text" placeholder="Price" validate={[required, greaterThan0, number]}/>

        <a className="button" onClick={close}>
          <i className="fa" />
          Cancel
        </a>

        <a className="button" onClick={this.save}>
          <i className="fa fa-floppy-o" />
          Save
        </a>
      </form>
    );
  }
}



export default reduxForm({
  form: 'new_product_dialog'
})(ReduxForm);


