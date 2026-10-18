import 'rxjs/add/operator/toPromise';
import PluginIncompatibleError from '../../domain/plugin/PluginIncompatibleError';
import PluginSettingsIncompleteError from '../../domain/plugin/PluginSettingsIncompleteError';
import {eventClasses} from '../../domain/event/registry';
import {openMarketCompatibility} from './semverRange';
import scopedEventBus from './scopedEventBus';
/** @typedef {import('../../domain/plugin/PluginSource').default} PluginSource */
/** @typedef {import('../../domain/plugin/PluginSource').PluginManifest} PluginManifest */
/** @typedef {import('../../domain/plugin/PluginRepository').default} PluginRepository */
/** @typedef {import('../../domain/plugin/PluginRepository').PluginState} PluginState */
/** @typedef {import('../../domain/service/DomainEventBus').default} DomainEventBus */
/** @typedef {import('../../domain/plugin/SecretStore').default} SecretStore */

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
   * @param {SecretStore} [deps.secretStore]
   * @param {import('../receipt/ReceiptSlots').default} [deps.receiptSlots]
   */
  constructor({
    pluginSource,
    pluginRepository,
    domainEventBus,
    connection,
    appVersion,
    loadPlugin,
    events,
    recordError,
    secretStore,
    receiptSlots
  }) {
    this._pluginSource = pluginSource;
    this._pluginRepository = pluginRepository;
    this._domainEventBus = domainEventBus;
    this._connection = connection;
    this._appVersion = appVersion;
    this._loadPlugin = loadPlugin;
    this._events = Object.freeze(events || eventClasses());
    this._recordError = typeof recordError === 'function' ? recordError : () => {};
    this._secretStore = secretStore || null;
    this._receiptSlots = receiptSlots || null;
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
    const prepared = this._prepareConfig(manifest, state);
    const missing = (manifest.settings || [])
      .filter(setting => setting.secret && setting.required)
      .map(setting => setting.key)
      .filter(key => !prepared.present[key]);
    if (missing.length > 0) {
      const error = new PluginSettingsIncompleteError({pluginId: manifest.id, keys: missing});
      this._recordError(error);
      this._store(prepared.state, error.message);
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
        config: prepared.config,
        secrets: {
          get: key => this._readSecret(manifest.id, key)
        },
        receipt: {
          register: (slot, render) => {
            if (!this._receiptSlots) {
              throw new Error('Receipt slots are not available');
            }
            const unsubscribe = this._receiptSlots.register({
              pluginId: manifest.id,
              slot,
              render
            });
            undo.push(unsubscribe);
            return unsubscribe;
          }
        },
        events: this._events
      });
      this._store(prepared.state, null);
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
      this._store(prepared.state, message);
    }
  }

  /**
   * Moves secret values out of config and records which secret keys are stored.
   * @param {PluginManifest} manifest
   * @param {PluginState} state
   * @returns {{state: PluginState, config: Record<string, string>, present: Record<string, boolean>}}
   */
  _prepareConfig(manifest, state) {
    const secretKeys = (manifest.settings || []).filter(setting => setting.secret).map(setting => setting.key);
    const config = {};
    const leaked = {};
    Object.keys(state.config || {}).forEach(key => {
      if (secretKeys.indexOf(key) === -1) {
        config[key] = state.config[key];
      } else if (state.config[key] != null && String(state.config[key]).trim() !== '') {
        leaked[key] = String(state.config[key]);
      }
    });
    Object.keys(leaked).forEach(key => {
      if (this._secretStore) {
        take(this._secretStore.put({pluginId: manifest.id, key, value: leaked[key]}));
      }
    });
    const next = Object.keys(leaked).length > 0 ? {...state, config} : state;
    if (next !== state) {
      this._store(next, next.lastError);
    }
    const present = {};
    secretKeys.forEach(key => {
      const stored = this._secretStore ? take(this._secretStore.get({pluginId: manifest.id, key})) : null;
      present[key] = stored != null && String(stored) !== '';
    });
    return {state: next, config, present};
  }

  /**
   * @param {string} pluginId
   * @param {string} key
   * @returns {Promise<string | null>}
   */
  _readSecret(pluginId, key) {
    if (!this._secretStore) {
      return Promise.resolve(null);
    }
    return this._secretStore.get({pluginId, key: String(key)}).toPromise()
      .then(value => value == null ? null : String(value));
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
