import PluginIncompatibleError from '../../domain/plugin/PluginIncompatibleError';
import {eventClasses} from '../../domain/event/registry';
import {openMarketCompatibility} from './semverRange';
import scopedEventBus from './scopedEventBus';
/** @import PluginSource from '../../domain/plugin/PluginSource' */
/** @import { PluginManifest } from '../../domain/plugin/PluginSource' */
/** @import PluginRepository from '../../domain/plugin/PluginRepository' */
/** @import { PluginState } from '../../domain/plugin/PluginRepository' */
/** @import DomainEventBus from '../../domain/service/DomainEventBus' */

export const PLUGIN_API_VERSION = 1;

/**
 * @param {import('rxjs/Observable').Observable} observable
 * @returns {*}
 */
function take(observable) {
  let value;
  let failure;
  observable.subscribe(
    next => {
      value = next;
    },
    error => {
      failure = error;
    }
  );
  if (failure) {
    throw failure;
  }
  return value;
}

/**
 * Loads enabled plugins before the durable dispatcher scans.
 */
export default class PluginHost {

  /**
   * @param {object} deps
   * @param {PluginSource} deps.pluginSource
   * @param {PluginRepository} deps.pluginRepository
   * @param {DomainEventBus} deps.domainEventBus
   * @param {{database: any}} deps.connection
   * @param {string} deps.appVersion
   * @param {(params: {directory: string, main: string}) => {register: Function}} deps.loadPlugin
   * @param {Record<string, Function>} [deps.events]
   * @param {(error: any) => void} [deps.recordError]
   */
  constructor({
    pluginSource,
    pluginRepository,
    domainEventBus,
    connection,
    appVersion,
    loadPlugin,
    events,
    recordError
  }) {
    this._pluginSource = pluginSource;
    this._pluginRepository = pluginRepository;
    this._domainEventBus = domainEventBus;
    this._connection = connection;
    this._appVersion = appVersion;
    this._loadPlugin = loadPlugin;
    this._events = Object.freeze(events || eventClasses());
    this._recordError = typeof recordError === 'function' ? recordError : () => {};
    this._started = false;
  }

  start() {
    if (this._started) {
      return;
    }
    this._started = true;
    const manifests = take(this._pluginSource.list()) || [];
    const states = take(this._pluginRepository.findAll()) || [];
    manifests.forEach(manifest => {
      const state = states.find(item => item.pluginId === manifest.id) || {
        pluginId: manifest.id,
        enabled: false,
        config: {},
        lastError: null
      };
      this._startOne(manifest, state);
    });
  }

  /**
   * @param {PluginManifest} manifest
   * @param {PluginState} state
   */
  _startOne(manifest, state) {
    const compatibility = openMarketCompatibility({
      version: this._appVersion,
      range: manifest.openmarket
    });
    if (!compatibility.ok) {
      const error = new PluginIncompatibleError({
        pluginId: manifest.id,
        range: manifest.openmarket,
        appVersion: this._appVersion,
        invalid: compatibility.invalid
      });
      this._recordError(error);
      this._store(state, error.message);
      return;
    }
    if (!state.enabled) {
      if (state.lastError) {
        this._store(state, null);
      }
      return;
    }
    const undo = [];
    const scoped = scopedEventBus({eventBus: this._domainEventBus, pluginId: manifest.id});
    const eventBus = {
      subscribeSync: (EventType, handler) => {
        const unsubscribe = scoped.subscribeSync(EventType, handler);
        undo.push(unsubscribe);
        return unsubscribe;
      },
      subscribeDurable: (name, EventType, handler, options) => {
        const unsubscribe = scoped.subscribeDurable(name, EventType, handler, options);
        undo.push(unsubscribe);
        return unsubscribe;
      },
      ofType: EventType => scoped.ofType(EventType)
    };
    try {
      const loaded = this._loadPlugin({directory: manifest.directory, main: manifest.main});
      loaded.register({
        apiVersion: PLUGIN_API_VERSION,
        eventBus,
        connection: this._connection,
        config: state.config || {},
        events: this._events
      });
      this._store(state, null);
    } catch (error) {
      undo.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (ignored) {
          this._recordError(ignored);
        }
      });
      this._recordError(error);
      const message = error && error.message ? error.message : 'Plugin failed to load';
      this._store(state, message);
    }
  }

  /**
   * @param {PluginState} state
   * @param {string | null} lastError
   */
  _store(state, lastError) {
    take(this._pluginRepository.save({
      pluginId: state.pluginId,
      enabled: Boolean(state.enabled),
      config: state.config || {},
      lastError
    }));
  }

}
