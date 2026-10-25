import React, {Component} from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import {PageHeader} from '../components/PageHeader';
import Skeleton from '../components/Skeleton';
import ShopForm from './ShopForm';
import ThemePicker from './ThemePicker';

export default class Container extends Component {

  componentWillMount() {
    if (this.props.settingsPageOpened) {
      this.props.settingsPageOpened();
    }
  }

  save = event => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    const page = this.props.settings || {};
    if (page.saving || page.loading || page.error) {
      return;
    }
    this.props.settingsSaveRequested();
  };

  change = (name, value) => {
    this.props.settingsDraftChanged({[name]: value});
  };

  previewTheme = id => {
    if (this.props.themePreviewRequested) {
      this.props.themePreviewRequested(id);
    }
    this.props.settingsDraftChanged({theme: id});
  };

  discardTheme = theme => {
    if (this.props.themePreviewDiscardRequested) {
      this.props.themePreviewDiscardRequested(theme);
    }
    this.props.settingsDraftChanged({theme});
  };

  render() {
    const page = this.props.settings || {};
    const appearance = this.props.appearance || {theme: 'mercado', applied: 'mercado'};
    return (
      <form className="container-fluid settings-page" onSubmit={this.save}>
        <PageHeader
          title="Ajustes"
          actions={
            <Button type="submit" disabled={page.loading || page.saving || !!page.error}>
              Guardar
            </Button>
          }
        />
        {this.body(page, appearance)}
      </form>
    );
  }

  body(page, appearance) {
    if (page.loading) {
      return <SettingsSkeletons />;
    }
    if (page.error) {
      return <SettingsFailure message={page.error} onRetry={this.props.settingsPageOpened} />;
    }
    return (
      <div className="settings-sections">
        {page.saveError ? <p className="settings-save-error" role="alert">{page.saveError}</p> : null}
        <Card title="Comercio">
          <ShopForm values={page.draft} fieldErrors={page.fieldErrors} onChange={this.change} />
        </Card>
        <Card title="Apariencia">
          <ThemePicker
            theme={appearance.theme}
            applied={appearance.applied}
            onPreview={this.previewTheme}
            onDiscard={this.discardTheme}
          />
        </Card>
      </div>
    );
  }

}

function SettingsSkeletons() {
  return (
    <div className="settings-sections" aria-hidden="true">
      <div className="settings-skeleton"><Skeleton lines={6} /></div>
      <div className="settings-skeleton"><Skeleton lines={3} /></div>
    </div>
  );
}

/**
 * @param {{message: string, onRetry: Function}} props
 */
function SettingsFailure(props) {
  return (
    <div className="settings-failure">
      <p role="alert">{props.message}</p>
      <Button variant="secondary" onClick={props.onRetry}>Reintentar</Button>
    </div>
  );
}
