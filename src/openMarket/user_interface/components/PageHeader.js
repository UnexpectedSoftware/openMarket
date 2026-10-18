import React from 'react';

/**
 * @typedef {Object} PageHeaderProps
 * @property {string} title
 * @property {string} [subtitle]
 * @property {*} [actions]
 */

/**
 * @param {PageHeaderProps} props
 */
export function PageHeader(props) {
  return (
    <header className="om-page-header">
      <div className="om-page-header-text">
        <h1 className="om-page-header-title">{props.title}</h1>
        {props.subtitle ? <p className="om-page-header-subtitle">{props.subtitle}</p> : null}
      </div>
      {props.actions ? <div className="om-page-header-actions">{props.actions}</div> : null}
    </header>
  );
}

/**
 * @typedef {Object} ToolbarProps
 * @property {*} children
 * @property {'start'|'end'|'between'} [align]
 */

/**
 * @param {ToolbarProps} props
 */
export function Toolbar(props) {
  const align = props.align || 'start';
  return (
    <div className={'om-toolbar om-toolbar--' + align}>{props.children}</div>
  );
}
