import React from 'react';
import Button from '../../components/Button';

const KEYS = [
  {id: '1', label: '1'},
  {id: '2', label: '2'},
  {id: '3', label: '3'},
  {id: '4', label: '4'},
  {id: '5', label: '5'},
  {id: '6', label: '6'},
  {id: '7', label: '7'},
  {id: '8', label: '8'},
  {id: '9', label: '9'},
  {id: 'clear', label: 'C', name: 'Limpiar'},
  {id: '0', label: '0'},
  {id: 'back', label: '⌫', name: 'Borrar'}
];

/**
 * On-screen quantity keys for the Táctil preset.
 * @param {{onKey?: function(string): void}} props
 */
export default function Keypad(props) {
  return (
    <div className="sell-keypad" role="group" aria-label="Cantidad">
      {KEYS.map(key => (
        <Button
          key={key.id}
          type="button"
          variant="secondary"
          label={key.name}
          onClick={() => props.onKey && props.onKey(key.id)}
        >
          {key.label}
        </Button>
      ))}
    </div>
  );
}
