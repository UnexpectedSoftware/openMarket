import React, {Component} from 'react';

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
          <label className="settings-field" key={field.name} htmlFor={`shop-${field.name}`}>
            {field.label}
            <input
              id={`shop-${field.name}`}
              name={field.name}
              type="text"
              value={values[field.name] || ''}
              onChange={event => onChange(field.name, event.target.value)}
            />
          </label>
        ))}
        <label className="settings-field settings-check">
          <input
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
