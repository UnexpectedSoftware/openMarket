import React from 'react';

/**
 * @typedef {Object} SpinnerProps
 * @property {'sm'|'md'|'lg'} [size]
 * @property {string} [label] Announced to assistive tech. Hidden visually.
 */

/**
 * @param {SpinnerProps} props
 */
export default function Spinner(props) {
  const size = props.size || 'md';
  const label = props.label || 'Loading';
  return (
    <span className={'om-spinner om-spinner--' + size} role="status">
      <span className="om-spinner-disc" aria-hidden="true" />
      <span className="om-visually-hidden">{label}</span>
    </span>
  );
}
