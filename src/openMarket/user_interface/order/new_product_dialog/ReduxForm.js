import React, {Component} from 'react';
import {Field, reduxForm} from 'redux-form';
import Button from '../../components/Button';
import NumberField from '../../components/NumberField';
import TextField from '../../components/TextField';
import reduxFormField from '../../components/reduxFormField';
import {greaterThan0, number, required} from '../../validations/formValidations';

const textField = reduxFormField(TextField);
const priceField = reduxFormField(NumberField);

class ReduxForm extends Component {

  constructor(props, context) {
    super(props, context);
    this.save = this.save.bind(this);
  }

  save(event) {
    this.props.handleSubmit(event);
  }

  render() {
    const {close} = this.props;
    return (
      <form onKeyPress={event => { if (event.which === 13) { event.preventDefault(); } }}>
        <Field name="barcode" component={textField} label="Barcode" validate={[required]} />
        <Field name="name" component={textField} label="Name" validate={required} />
        <Field name="price" component={priceField} label="Price" unit="€" validate={[required, greaterThan0, number]} />
        <div className="om-gallery-row">
          <Button type="button" icon="floppy-o" onClick={this.save}>Save</Button>
          <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
        </div>
      </form>
    );
  }
}

export default reduxForm({
  form: 'new_product_dialog'
})(ReduxForm);
