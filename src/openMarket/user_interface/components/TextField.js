import React from 'react';
import {assertProps} from './devCheck';

/**
 * @typedef {Object} TextFieldProps
 * @property {string} id
 * @property {string} label
 * @property {string} [name]
 * @property {string} [value]
 * @property {Function} [onChange]
 * @property {Function} [onBlur]
 * @property {Function} [onFocus]
 * @property {string} [error]
 * @property {string} [hint]
 * @property {boolean} [required]
 * @property {boolean} [autoFocus]
 * @property {Function} [inputRef]
 * @property {boolean} [readOnly]
 * @property {string} [placeholder]
 * @property {string} [type]
 * @property {boolean} [multiline]
 * @property {string} [inputMode]
 * @property {string} [suffix]
 * @property {string|number} [min]
 * @property {string|number} [max]
 * @property {string|number} [step]
 */

/**
 * @param {TextFieldProps} props
 */
export default function TextField(props) {
  assertProps('TextField', props, ['id', 'label']);
  const errorId = props.id + '-error';
  const hintId = props.id + '-hint';
  const described = [];
  if (props.hint) {
    described.push(hintId);
  }
  if (props.error) {
    described.push(errorId);
  }
  const control = {
    id: props.id,
    name: props.name,
    className: 'om-field-control',
    value: props.value == null ? '' : props.value,
    onChange: props.onChange,
    onBlur: props.onBlur,
    onFocus: props.onFocus,
    readOnly: props.readOnly,
    placeholder: props.placeholder,
    required: props.required,
    autoFocus: props.autoFocus,
    inputMode: props.inputMode,
    'aria-invalid': props.error ? 'true' : undefined,
    'aria-describedby': described.length ? described.join(' ') : undefined,
    ref: props.inputRef
  };
  const classes = ['om-field'];
  if (props.error) {
    classes.push('has-error');
  }
  return (
    <div className={classes.join(' ')}>
      <label className="om-field-label" htmlFor={props.id}>{props.label}</label>
      <div className="om-field-control-row">
        {props.multiline
          ? <textarea {...control} />
          : <input {...control} type={props.type || 'text'} min={props.min} max={props.max} step={props.step} />}
        {props.suffix ? <span className="om-field-suffix">{props.suffix}</span> : null}
      </div>
      {props.hint ? <p className="om-field-hint" id={hintId}>{props.hint}</p> : null}
      {props.error ? <p className="om-field-error" id={errorId} role="alert">{props.error}</p> : null}
    </div>
  );
}
