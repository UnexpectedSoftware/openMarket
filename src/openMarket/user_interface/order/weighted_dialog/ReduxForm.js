import React, {Component} from 'react';
import {Field, reduxForm} from 'redux-form';
import Button from '../../components/Button';
import NumberField from '../../components/NumberField';
import reduxFormField from '../../components/reduxFormField';
import {greaterThan0, number, required} from '../../validations/formValidations';

const quantityField = reduxFormField(NumberField);

class ReduxForm extends Component {

  constructor(props, context) {
    super(props, context);
    this.save = this.save.bind(this);
  }

  save(event) {
    this.props.handleSubmit(event);
  }

  render() {
    return (
      <form onKeyPress={event => { if (event.which === 13) { event.preventDefault(); } }}>
        <Field
          name="quantity"
          component={quantityField}
          label="Cantidad"
          unit="kg"
          inputRef={this.props.quantityRef}
          validate={[required, greaterThan0, number]}
        />
        <Button type="button" icon="floppy-o" onClick={this.save}>Save</Button>
      </form>
    );
  }
}

export default reduxForm({
  form: 'weighted_dialog'
})(ReduxForm);
