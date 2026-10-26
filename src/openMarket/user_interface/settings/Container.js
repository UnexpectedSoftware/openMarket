import React, {Component} from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import {PageHeader} from '../components/PageHeader';
import Skeleton from '../components/Skeleton';
import LanguageForm from './LanguageForm';
import LayoutPicker from './LayoutPicker';
import PrinterForm from './PrinterForm';
import ShopForm from './ShopForm';
import ThemePicker from './ThemePicker';
import TicketForm from './TicketForm';

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
    if (page.saving || page.printing || page.loading || page.error) {
      return;
    }
    this.props.settingsSaveRequested();
  };

  testPrint = () => {
    const page = this.props.settings || {};
    if (page.saving || page.printing || page.loading || page.error) {
      return;
    }
    if (this.props.settingsTestPrintRequested) {
      this.props.settingsTestPrintRequested();
    }
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

  previewLayout = id => {
    if (this.props.layoutPreviewRequested) {
      this.props.layoutPreviewRequested(id);
    }
    this.props.settingsDraftChanged({layout: id});
  };

  discardLayout = layout => {
    if (this.props.layoutPreviewDiscardRequested) {
      this.props.layoutPreviewDiscardRequested(layout);
    }
    this.props.settingsDraftChanged({layout});
  };

  render() {
    const page = this.props.settings || {};
    const appearance = this.props.appearance || {
      theme: 'mercado',
      applied: 'mercado',
      layout: 'mostrador',
      appliedLayout: 'mostrador'
    };
    return (
      <form className="container-fluid settings-page" onSubmit={this.save}>
        <PageHeader
          title="Ajustes"
          actions={
            <Button type="submit" disabled={page.loading || page.saving || page.printing || !!page.error}>
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
        <Card title="Ticket">
          <TicketForm values={page.draft} fieldErrors={page.fieldErrors} onChange={this.change} />
        </Card>
        <Card title="Impresora">
          <PrinterForm
            values={page.draft}
            fieldErrors={page.fieldErrors}
            printerError={page.printerError}
            printing={page.printing}
            saving={page.saving}
            onChange={this.change}
            onTestPrint={this.testPrint}
          />
        </Card>
        <Card title="Apariencia">
          <ThemePicker
            theme={appearance.theme}
            applied={appearance.applied}
            onPreview={this.previewTheme}
            onDiscard={this.discardTheme}
          />
          <p className="settings-section-label" id="sell-layout-label">Disposición</p>
          <LayoutPicker
            layout={appearance.layout || 'mostrador'}
            applied={appearance.appliedLayout || appearance.layout || 'mostrador'}
            onPreview={this.previewLayout}
            onDiscard={this.discardLayout}
          />
        </Card>
        <Card title="Idioma">
          <LanguageForm values={page.draft} onChange={this.change} />
        </Card>
      </div>
    );
  }

}

function SettingsSkeletons() {
  return (
    <div className="settings-sections" aria-hidden="true">
      <div className="settings-skeleton"><Skeleton lines={6} /></div>
      <div className="settings-skeleton"><Skeleton lines={4} /></div>
      <div className="settings-skeleton"><Skeleton lines={3} /></div>
      <div className="settings-skeleton"><Skeleton lines={3} /></div>
      <div className="settings-skeleton"><Skeleton lines={2} /></div>
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
