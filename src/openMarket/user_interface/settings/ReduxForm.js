import React, {Component} from 'react';
import TextField from '../components/TextField';

const FIELDS = [
  {name: 'nif', label: 'NIF'},
  {name: 'legalName', label: 'Razón social'},
  {name: 'tradeName', label: 'Nombre comercial'},
  {name: 'street', label: 'Calle'},
  {name: 'postalCode', label: 'Código postal'},
  {name: 'city', label: 'Ciudad'},
  {name: 'province', label: 'Provincia'},
  {name: 'country', label: 'País'}
];

export default class ReduxForm extends Component {

  render() {
    const {values, onChange, error} = this.props;
    return (
      <div>
        {FIELDS.map(field => (
          <TextField
            key={field.name}
            id={'shop-' + field.name}
            name={field.name}
            label={field.label}
            value={values[field.name] || ''}
            onChange={event => onChange(field.name, event.target.value)}
          />
        ))}
        <label className="settings-field settings-check">
          <input
            id="shop-invoicing"
            name="invoicingEnabled"
            type="checkbox"
            checked={values.invoicingEnabled === true}
            onChange={event => onChange('invoicingEnabled', event.target.checked)}
          />
          Emitir facturas
        </label>
        {error ? <p className="settings-error" role="alert">{error}</p> : null}
      </div>
    );
  }

}
