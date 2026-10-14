import PluginSubscriberNameError from '../../domain/plugin/PluginSubscriberNameError';
/** @import DomainEventBus from '../../domain/service/DomainEventBus' */

/**
 * The only bus a plugin receives. Durable names are prefixed with the plugin id.
 * A name with no colon is prefixed. A name that already uses this plugin's prefix
 * is kept. Any other colon form is refused.
 * @param {{eventBus: DomainEventBus, pluginId: string}} params
 */
export default function scopedEventBus({eventBus, pluginId}) {
  const prefix = `${pluginId}:`;
  return {
    /**
     * @param {Function} EventType
     * @param {(event: any) => void} handler
     * @returns {() => void}
     */
    subscribeSync(EventType, handler) {
      return eventBus.subscribeSync(EventType, handler);
    },

    /**
     * @param {string} name
     * @param {Function} EventType
     * @param {(event: any) => void} handler
     * @param {{ordered?: boolean, maxAttempts?: number}} [options]
     * @returns {() => void}
     */
    subscribeDurable(name, EventType, handler, options) {
      if (typeof name !== 'string' || name.trim() === '') {
        throw new PluginSubscriberNameError({pluginId, subscriberName: name});
      }
      let scoped = name;
      if (!name.startsWith(prefix)) {
        if (name.includes(':')) {
          throw new PluginSubscriberNameError({pluginId, subscriberName: name});
        }
        scoped = prefix + name;
      }
      return eventBus.subscribeDurable(scoped, EventType, handler, options);
    },

    /**
     * @param {Function} EventType
     * @returns {import('rxjs/Observable').Observable}
     */
    ofType(EventType) {
      return eventBus.ofType(EventType);
    }
  };
}
