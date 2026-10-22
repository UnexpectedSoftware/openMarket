import React from 'react';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import TextField from '../../components/TextField';
import {RANGE_CHIPS} from './ranges';

/**
 * @param {{rangeKey: string, onSelect: Function, onCustom: Function}} props
 */
export function OrdersRanges(props) {
  return (
    <div className="orders-ranges" role="group" aria-label="Periodo">
      {RANGE_CHIPS.map(chip => (
        <Button
          key={chip.key}
          variant={props.rangeKey === chip.key ? 'primary' : 'secondary'}
          pressed={props.rangeKey === chip.key}
          onClick={() => props.onSelect(chip.key)}
        >
          {chip.label}
        </Button>
      ))}
      <Button
        variant={props.rangeKey === 'custom' ? 'primary' : 'secondary'}
        pressed={props.rangeKey === 'custom'}
        onClick={props.onCustom}
      >
        Rango…
      </Button>
    </div>
  );
}

/**
 * @param {{open: boolean, from: string, to: string, error: string, onFrom: Function, onTo: Function, onClose: Function, onApply: Function, fromRef: {current: HTMLElement}, onFromRef: Function}} props
 */
export function RangeDialog(props) {
  return (
    <Dialog
      open={props.open}
      title="Rango"
      onClose={props.onClose}
      initialFocusRef={props.fromRef}
      actions={<Button onClick={props.onApply}>Aplicar</Button>}
    >
      <div className="orders-range-fields">
        <TextField
          id="orders-range-from"
          label="Desde"
          type="date"
          value={props.from}
          onChange={props.onFrom}
          inputRef={props.onFromRef}
          error={props.error}
        />
        <TextField
          id="orders-range-to"
          label="Hasta"
          type="date"
          value={props.to}
          onChange={props.onTo}
        />
      </div>
    </Dialog>
  );
}
