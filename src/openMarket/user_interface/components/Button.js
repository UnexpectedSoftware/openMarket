import React from 'react';
import Spinner from './Spinner';

/**
 * @typedef {Object} ButtonProps
 * @property {'primary'|'secondary'|'ghost'|'danger'} [variant]
 * @property {'md'|'lg'} [size]
 * @property {'button'|'submit'|'reset'} [type]
 * @property {boolean} [disabled]
 * @property {boolean} [busy]
 * @property {string} [icon] Font Awesome name without the `fa-` prefix
 * @property {string} [className]
 * @property {string} [title]
 * @property {string} [label] Accessible name when it should differ from the visible text.
 * @property {Function} [onClick]
 * @property {boolean} [expanded] Sets aria-expanded when the button toggles a panel.
 * @property {boolean} [pressed] Sets aria-pressed when the button toggles a choice.
 * @property {*} [children]
 */

/**
 * @param {ButtonProps} props
 */
export default function Button(props) {
  const variant = props.variant || 'primary';
  const size = props.size || 'md';
  const classes = ['om-button', 'om-button--' + variant];
  if (size === 'lg') {
    classes.push('om-button--lg');
  }
  if (props.busy) {
    classes.push('is-busy');
  }
  if (props.className) {
    classes.push(props.className);
  }
  return (
    <button
      type={props.type || 'button'}
      className={classes.join(' ')}
      disabled={props.disabled || props.busy ? true : undefined}
      aria-busy={props.busy ? 'true' : undefined}
      title={props.title}
      aria-label={props.label || undefined}
      aria-expanded={props.expanded == null ? undefined : String(!!props.expanded)}
      aria-pressed={props.pressed == null ? undefined : String(!!props.pressed)}
      onClick={props.onClick}
    >
      {props.busy ? <Spinner size="sm" label="Working" /> : null}
      {props.icon && !props.busy ? <i className={'fa fa-' + props.icon} aria-hidden="true" /> : null}
      {props.children}
    </button>
  );
}
