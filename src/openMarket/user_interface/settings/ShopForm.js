import React from 'react';
import TextField from '../components/TextField';

const FIELDS = [
  {name: 'nif', label: 'NIF'},
  {name: 'legalName', label: 'Razón social'},
  {name: 'tradeName', label: 'Nombre comercial'},
  {name: 'street', label: 'Calle'},
  {name: 'postalCode', label: 'Código postal'},
  {name: 'city', label: 'Ciudad'},
  {name: 'province', label: 'Provincia'},
  {name: 'country', label: 'País'},
  {name: 'phone', label: 'Teléfono', inputMode: 'tel'},
  {name: 'email', label: 'Correo', inputMode: 'email'}
];

/**
 * @param {{values: object, fieldErrors?: object, onChange: Function}} props
 */
export default function ShopForm(props) {
  const values = props.values || {};
  const fieldErrors = props.fieldErrors || {};
  return (
    <div className="settings-fields">
      {FIELDS.map(field => (
        <TextField
          key={field.name}
          id={'shop-' + field.name}
          name={field.name}
          label={field.label}
          type="text"
          inputMode={field.inputMode}
          value={values[field.name] || ''}
          error={fieldErrors[field.name]}
          onChange={event => props.onChange(field.name, event.target.value)}
        />
      ))}
      <div className="om-field om-field--check settings-span">
        <input
          id="shop-invoicing"
          name="invoicingEnabled"
          type="checkbox"
          checked={values.invoicingEnabled === true}
          onChange={event => props.onChange('invoicingEnabled', event.target.checked)}
        />
        <label htmlFor="shop-invoicing">Emitir facturas</label>
      </div>
    </div>
  );
}
