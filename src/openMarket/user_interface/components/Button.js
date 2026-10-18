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
 * @property {Function} [onClick]
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
      onClick={props.onClick}
    >
      {props.busy ? <Spinner size="sm" label="Working" /> : null}
      {props.icon && !props.busy ? <i className={'fa fa-' + props.icon} aria-hidden="true" /> : null}
      {props.children}
    </button>
  );
}
