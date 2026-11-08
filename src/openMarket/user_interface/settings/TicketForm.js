import React from 'react';
import Select from '../components/Select';
import TextField from '../components/TextField';
import {ticketTemplateId} from './model';

const PRINT_MODES = [
  {value: 'always', label: 'Siempre'},
  {value: 'ask', label: 'Preguntar'},
  {value: 'never', label: 'Nunca'}
];

const TEMPLATES = [
  {value: 'classic-80', label: '80 mm clásica'},
  {value: 'classic-58', label: '58 mm clásica'}
];

/**
 * @param {{values: object, fieldErrors?: object, onChange: Function}} props
 */
export default function TicketForm(props) {
  const values = props.values || {};
  const fieldErrors = props.fieldErrors || {};
  const template = ticketTemplateId(values);
  return (
    <div className="settings-fields">
      <Select
        id="ticket-print-mode"
        name="printMode"
        label="Al imprimir"
        value={values.printMode || 'ask'}
        options={PRINT_MODES}
        onChange={event => props.onChange('printMode', event.target.value)}
      />
      <Select
        id="ticket-template"
        name="templateId"
        label="Plantilla"
        value={template}
        options={TEMPLATES}
        onChange={event => props.onChange('templateId', event.target.value)}
      />
      <div className="settings-span">
        <TextField
          id="ticket-header"
          name="headerText"
          label="Cabecera"
          value={values.headerText || ''}
          error={fieldErrors.headerText}
          onChange={event => props.onChange('headerText', event.target.value)}
        />
      </div>
      <div className="settings-span">
        <TextField
          id="ticket-footer"
          name="footerText"
          label="Pie"
          value={values.footerText || ''}
          error={fieldErrors.footerText}
          onChange={event => props.onChange('footerText', event.target.value)}
        />
      </div>
    </div>
  );
}
