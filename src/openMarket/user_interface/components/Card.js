import React from 'react';

/**
 * @typedef {Object} CardProps
 * @property {string} [title]
 * @property {*} [actions]
 * @property {*} [children]
 * @property {string} [as] Host element. Defaults to `section`.
 */

/**
 * @param {CardProps} props
 */
export default function Card(props) {
  const Tag = props.as || 'section';
  return (
    <Tag className="om-card">
      {props.title || props.actions ? (
        <div className="om-card-header">
          {props.title ? <h2 className="om-card-title">{props.title}</h2> : null}
          {props.actions ? <div className="om-card-actions">{props.actions}</div> : null}
        </div>
      ) : null}
      <div className="om-card-body">{props.children}</div>
    </Tag>
  );
}
