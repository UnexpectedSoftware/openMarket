import React from 'react';
import {assertProps} from './devCheck';

/**
 * @typedef {Object} IconButtonProps
 * @property {string} icon Font Awesome name without the `fa-` prefix
 * @property {string} label Accessible name. Also used as the tooltip.
 * @property {'primary'|'secondary'|'ghost'|'danger'} [variant]
 * @property {boolean} [disabled]
 * @property {Function} [onClick]
 */

/**
 * @param {IconButtonProps} props
 */
export default function IconButton(props) {
  assertProps('IconButton', props, ['icon', 'label']);
  const variant = props.variant || 'ghost';
  return (
    <button
      type="button"
      className={'om-icon-button om-icon-button--' + variant}
      aria-label={props.label}
      title={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      <i className={'fa fa-' + props.icon} aria-hidden="true" />
    </button>
  );
}
