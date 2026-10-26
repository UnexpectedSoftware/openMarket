import React from 'react';
import Select from '../components/Select';

const LOCALES = [
  {value: 'es', label: 'Español'}
];

/**
 * @param {{values: object, onChange: Function}} props
 */
export default function LanguageForm(props) {
  const values = props.values || {};
  return (
    <div className="settings-fields">
      <Select
        id="language-locale"
        name="locale"
        label="Idioma"
        value={values.locale || 'es'}
        options={LOCALES}
        onChange={event => props.onChange('locale', event.target.value)}
      />
    </div>
  );
}
