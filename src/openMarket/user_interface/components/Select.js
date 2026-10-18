import React from 'react';
import {assertProps} from './devCheck';

/**
 * @typedef {Object} SelectOption
 * @property {string|number} value
 * @property {string} label
 */

/**
 * @typedef {Object} SelectProps
 * @property {string} id
 * @property {string} label
 * @property {string} [name]
 * @property {SelectOption[]} options
 * @property {string|number} [value]
 * @property {Function} [onChange]
 * @property {Function} [onBlur]
 * @property {Function} [onFocus]
 * @property {string} [error]
 */

/**
 * @param {SelectProps} props
 */
export default function Select(props) {
  assertProps('Select', props, ['id', 'label']);
  const errorId = props.id + '-error';
  const options = props.options || [];
  const classes = ['om-field'];
  if (props.error) {
    classes.push('has-error');
  }
  return (
    <div className={classes.join(' ')}>
      <label className="om-field-label" htmlFor={props.id}>{props.label}</label>
      <select
        id={props.id}
        name={props.name}
        className="om-field-control"
        value={props.value == null ? '' : props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
        onFocus={props.onFocus}
        aria-invalid={props.error ? 'true' : undefined}
        aria-describedby={props.error ? errorId : undefined}
      >
        {options.map(option =>
          <option value={option.value} key={String(option.value)}>{option.label}</option>
        )}
      </select>
      {props.error ? <p className="om-field-error" id={errorId} role="alert">{props.error}</p> : null}
    </div>
  );
}
