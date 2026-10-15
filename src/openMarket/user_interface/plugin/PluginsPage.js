import React, {Component} from 'react';

class PluginCard extends Component {

  constructor(props) {
    super(props);
    this.state = {config: props.plugin.config || {}};
  }

  componentWillReceiveProps(nextProps) {
    const previous = JSON.stringify(this.props.plugin.config || {});
    const next = JSON.stringify(nextProps.plugin.config || {});
    if (previous !== next) {
      this.setState({config: nextProps.plugin.config || {}});
    }
  }

  _save(plugin, enabled) {
    if (plugin.enabled && !enabled) {
      const confirmed = window.confirm(
        `Disable ${plugin.name}? Some plugins are legally required. OpenMarket stops running it after you restart.`
      );
      if (!confirmed) {
        return;
      }
    }
    this.props.pluginSaveRequested({
      pluginId: plugin.id,
      enabled,
      config: this.state.config
    });
  }

  _set(key, value) {
    this.setState(state => ({config: {...state.config, [key]: value}}));
  }

  render() {
    const {plugin} = this.props;
    const settings = plugin.settings || [];
    return (
      <article className="plugin-card">
        <h2 className="plugin-card-name">{plugin.name}</h2>
        {plugin.description ? <p>{plugin.description}</p> : null}
        {plugin.version ? <p className="plugin-card-version">{plugin.version}</p> : null}
        {settings.map(setting => (
          <label className="plugin-setting" key={setting.key}>
            {setting.label}
            <input
              type={setting.secret ? 'password' : 'text'}
              autoComplete={setting.secret ? 'new-password' : 'off'}
              value={this.state.config[setting.key] || ''}
              placeholder={setting.secret && (plugin.storedSecrets || []).indexOf(setting.key) !== -1 ? 'Stored' : ''}
              onChange={event => this._set(setting.key, event.target.value)}
            />
          </label>
        ))}
        <label className="plugin-enabled">
          <input
            type="checkbox"
            checked={plugin.enabled}
            aria-label={`Enabled ${plugin.name}`}
            onChange={event => this._save(plugin, event.target.checked)}
          />
          Enabled
        </label>
        {settings.length > 0 ? (
          <button type="button" className="button" onClick={() => this._save(plugin, plugin.enabled)}>
            Save
          </button>
        ) : null}
        {plugin.lastError ? <p className="plugin-card-error" role="alert">{plugin.lastError}</p> : null}
      </article>
    );
  }

}

export default class PluginsPage extends Component {

  componentWillMount() {
    this.props.pluginsPageLoaded();
  }

  render() {
    const {directory, plugins, loaded, restartRequired, error, encryption} = this.props.pluginsPage;
    const hasSecret = plugins.some(plugin => (plugin.settings || []).some(setting => setting.secret));
    const basic = encryption && (encryption.available === false || encryption.backend === 'basic_text');
    return (
      <section className="plugins-page">
        <h2>Plugins</h2>
        {hasSecret && basic ? (
          <p className="plugin-restart" role="status">Secrets are stored with basic encryption.</p>
        ) : null}
        {hasSecret && !basic ? (
          <p className="plugin-directory" role="status">Secrets are stored securely.</p>
        ) : null}
        <p className="plugin-directory">
          Copy a plugin folder into {directory || 'the plugins directory'}, then restart OpenMarket.
        </p>
        {restartRequired ? (
          <p className="plugin-restart" role="status">Restart OpenMarket to apply this change.</p>
        ) : null}
        {error ? <p className="plugin-card-error" role="alert">{error}</p> : null}
        {loaded && plugins.length === 0 ? <p>No plugins are installed.</p> : null}
        <div className="plugin-cards">
          {plugins.map(plugin => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              pluginSaveRequested={this.props.pluginSaveRequested}
            />
          ))}
        </div>
      </section>
    );
  }

}
