import React from 'react';
import Button from '../components/Button';
import Select from '../components/Select';
import TextField from '../components/TextField';

const TYPES = [
  {value: 'epson', label: 'Epson'},
  {value: 'star', label: 'Star'}
];

const CHARACTER_SETS = [
  {value: 'SPAIN1', label: 'SPAIN1'},
  {value: 'PC858', label: 'PC858'},
  {value: 'PC850', label: 'PC850'},
  {value: 'WPC1252', label: 'WPC1252'}
];

const INTERFACE_HINT = 'Ruta USB, tcp://ip:9100, o el nombre de la impresora';

/**
 * @param {{values: object, fieldErrors?: object, printerError?: string | null, printing?: boolean, saving?: boolean, onChange: Function, onTestPrint: Function}} props
 */
export default function PrinterForm(props) {
  const values = props.values || {};
  const fieldErrors = props.fieldErrors || {};
  const busy = props.printing || props.saving;
  return (
    <div>
      <div className="settings-fields">
        <Select
          id="printer-type"
          name="printerType"
          label="Tipo"
          value={values.printerType || 'epson'}
          options={TYPES}
          onChange={event => props.onChange('printerType', event.target.value)}
        />
        <Select
          id="printer-character-set"
          name="printerCharacterSet"
          label="Juego de caracteres"
          value={values.printerCharacterSet || 'SPAIN1'}
          options={CHARACTER_SETS}
          onChange={event => props.onChange('printerCharacterSet', event.target.value)}
        />
        <div className="settings-span">
          <TextField
            id="printer-interface"
            name="printerInterface"
            label="Interfaz"
            hint={INTERFACE_HINT}
            value={values.printerInterface == null ? '/dev/usb/lp' : values.printerInterface}
            error={fieldErrors.printerInterface}
            onChange={event => props.onChange('printerInterface', event.target.value)}
          />
        </div>
      </div>
      <div className="settings-printer-actions">
        {props.printerError
          ? <p className="settings-printer-error" role="alert">{props.printerError}</p>
          : null}
        <Button variant="secondary" disabled={busy} onClick={props.onTestPrint}>
          Imprimir prueba
        </Button>
      </div>
    </div>
  );
}
