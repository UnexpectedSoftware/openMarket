import React from 'react';

/**
 * Named place for plugin status on the sell screen.
 * The plugin host has no UI-slot registry, so nothing is drawn.
 * Receipt blocks stay on the ticket. Issue 105 stays open.
 * @param {{name: string}} props
 */
export default function PluginSlot(props) {
  if (!props || !props.name) {
    return null;
  }
  return null;
}
