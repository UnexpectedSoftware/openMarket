import React, {Component} from 'react';
import ReduxForm from './ReduxForm';

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

  _save(event) {
    event.preventDefault();
    this.props.shopProfileSaveRequested(this.state);
  }

  render() {
    const {settings} = this.props;
    if (!settings.loaded) {
      return (
        <section className="settings-page">
          <h2>Settings</h2>
          {settings.error ? <p className="settings-error" role="alert">{settings.error}</p> : <p>Loading shop settings…</p>}
        </section>
      );
    }
    return (
      <section className="settings-page">
        <h2>Settings</h2>
        <form className="settings-shop" onSubmit={this._save}>
          <h3>Comercio</h3>
          <ReduxForm values={this.state} onChange={this._change} error={settings.error} />
          {settings.saved ? <p className="settings-saved" role="status">Shop saved</p> : null}
          <button type="submit" className="button">Save</button>
        </form>
      </section>
    );
  }

}
