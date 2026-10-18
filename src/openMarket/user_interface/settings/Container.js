import React, {Component} from 'react';
import Button from '../components/Button';
import ReduxForm from './ReduxForm';
import ThemePicker from './ThemePicker';

function fields(settings) {
  return {
    nif: settings.nif || '',
    legalName: settings.legalName || '',
    tradeName: settings.tradeName || '',
    street: settings.street || '',
    postalCode: settings.postalCode || '',
    city: settings.city || '',
    province: settings.province || '',
    country: settings.country || 'ES',
    invoicingEnabled: settings.invoicingEnabled === true
  };
}

export default class Container extends Component {

  constructor(props) {
    super(props);
    this.state = fields(props.settings);
    this._change = this._change.bind(this);
    this._save = this._save.bind(this);
    this._persistTheme = this._persistTheme.bind(this);
  }

  componentWillMount() {
    if (this.props.shopProfileRequested) {
      this.props.shopProfileRequested();
    }
  }

  componentWillReceiveProps(next) {
    if (next.settings.revision !== this.props.settings.revision) {
      this.setState(fields(next.settings));
    }
  }

  _change(name, value) {
    this.setState({[name]: value});
  }

  _persistTheme(applied) {
    if (!this.props.themeChangeRequested || !applied) {
      return;
    }
    const saved = this.props.appearance && this.props.appearance.theme;
    this.props.themeChangeRequested(applied, saved || 'mercado');
  }

  _save(event) {
    event.preventDefault();
    const appearance = this.props.appearance || {};
    if (appearance.applied && appearance.applied !== appearance.theme) {
      this._persistTheme(appearance.applied);
    }
    this.props.shopProfileSaveRequested(this.state);
  }

  render() {
    const {settings, appearance} = this.props;
    const theme = appearance || {theme: 'mercado', applied: 'mercado'};
    const picker = (
      <ThemePicker
        theme={theme.theme}
        applied={theme.applied}
        onPreview={this.props.themePreviewRequested}
        onSave={this._persistTheme}
        onDiscard={this.props.themePreviewDiscardRequested}
      />
    );
    if (!settings.loaded) {
      return (
        <section className="settings-page">
          <h2>Settings</h2>
          {picker}
          {settings.error ? <p className="settings-error" role="alert">{settings.error}</p> : <p>Loading shop settings…</p>}
        </section>
      );
    }
    return (
      <section className="settings-page">
        <h2>Settings</h2>
        {picker}
        <form className="settings-shop" onSubmit={this._save}>
          <h3>Comercio</h3>
          <ReduxForm values={this.state} onChange={this._change} error={settings.error} />
          {settings.saved ? <p className="settings-saved" role="status">Shop saved</p> : null}
          <Button type="submit">Save</Button>
        </form>
      </section>
    );
  }

}
