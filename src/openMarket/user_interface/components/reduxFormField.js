import React from 'react';

/**
 * Adapts a presentational field to redux-form 6 (`input` + `meta`).
 * Field `name` stays on the control so `input[name=…]` selectors keep working.
 * @param {Function} Component
 * @returns {Function}
 */
export default function reduxFormField(Component) {
  return function ReduxFormField(props) {
    const input = props.input || {};
    const meta = props.meta || {};
    const error = meta.touched && meta.error ? meta.error : null;
    return (
      <Component
        id={props.id || input.name}
        name={input.name}
        label={props.label}
        value={input.value}
        onChange={input.onChange}
        onBlur={input.onBlur}
        onFocus={input.onFocus}
        error={error}
        hint={props.hint}
        required={props.required}
        readOnly={props.readOnly}
        placeholder={props.placeholder}
        autoFocus={props.autoFocus}
        inputRef={props.inputRef}
        multiline={props.multiline}
        type={props.type}
        options={props.options}
        step={props.step}
        min={props.min}
        max={props.max}
        decimals={props.decimals}
        unit={props.unit}
      />
    );
  };
}
