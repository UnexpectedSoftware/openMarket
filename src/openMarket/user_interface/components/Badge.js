import React from 'react';

/**
 * @typedef {Object} BadgeProps
 * @property {'neutral'|'success'|'warning'|'danger'|'primary'} [tone]
 * @property {*} children Visible text. Colour is never the only signal.
 */

/**
 * @param {BadgeProps} props
 */
export function Badge(props) {
  const tone = props.tone || 'neutral';
  return (
    <span className={'om-badge om-badge--' + tone}>{props.children}</span>
  );
}

/**
 * Same as {@link Badge}. Named for status text such as Activo / Desactivado.
 * @param {BadgeProps} props
 */
export function StatusPill(props) {
  return (
    <Badge tone={props.tone}>{props.children}</Badge>
  );
}

export default Badge;
