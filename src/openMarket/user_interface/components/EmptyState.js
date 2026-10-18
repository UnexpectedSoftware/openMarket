import React from 'react';

/**
 * @typedef {Object} EmptyStateProps
 * @property {string} [icon] Font Awesome name without the `fa-` prefix
 * @property {string} title
 * @property {string} [message]
 * @property {*} [action] Usually a Button, or a link styled as one.
 */

/**
 * @param {EmptyStateProps} props
 */
export default function EmptyState(props) {
  return (
    <div className="om-empty">
      {props.icon ? <i className={'om-empty-icon fa fa-' + props.icon} aria-hidden="true" /> : null}
      <p className="om-empty-title">{props.title}</p>
      {props.message ? <p className="om-empty-message">{props.message}</p> : null}
      {props.action ? <div className="om-empty-action">{props.action}</div> : null}
    </div>
  );
}
