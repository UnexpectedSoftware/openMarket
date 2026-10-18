import React from 'react';

/**
 * @typedef {Object} SkeletonProps
 * @property {number} [lines]
 * @property {string} [width] CSS length, usually a percentage.
 */

/**
 * @param {SkeletonProps} props
 */
export default function Skeleton(props) {
  const count = props.lines || 1;
  const lines = [];
  for (let index = 0; index < count; index += 1) {
    lines.push(
      <span
        key={index}
        className="om-skeleton-line"
        style={props.width ? {width: props.width} : undefined}
      />
    );
  }
  return (
    <span className="om-skeleton" aria-hidden="true">{lines}</span>
  );
}
