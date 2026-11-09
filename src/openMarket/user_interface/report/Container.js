import React, {Component} from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import Dialog from '../components/Dialog';
import EmptyState from '../components/EmptyState';
import {PageHeader} from '../components/PageHeader';
import Spinner from '../components/Spinner';
import TextField from '../components/TextField';
import {formatPeriod} from './format';
import {customRange, customRangeMessage, RANGE_CHIPS, rangeFor} from './ranges';
import SummaryView from './SummaryView';

export default class ReportContainer extends Component {

  constructor(props) {
    super(props);
    this.focus = {current: null};
    this.onFromRef = element => {
      this.focus.current = element;
    };
  }

  componentDidMount() {
    const range = rangeFor('week');
    this.props.reportRangeSelected({key: 'week', from: range.from, to: range.to});
  }

  selectChip(key) {
    const range = rangeFor(key);
    this.props.reportRangeSelected({key, from: range.from, to: range.to});
  }

  applyCustom() {
    const report = this.props.report;
    const message = customRangeMessage(report.customFrom, report.customTo);
    if (message) {
      this.props.reportCustomRejected(message);
      return;
    }
    const range = customRange(report.customFrom, report.customTo);
    this.props.reportRangeSelected({key: 'custom', from: range.from, to: range.to});
  }

  render() {
    const report = this.props.report;
    const subtitle = report.summary ? formatPeriod(report.summary.from, report.summary.to) : '';
    return (
      <div className="report-screen">
        <div className="report-nav">
          <Card title="Informes">
            <nav aria-label="Secciones">
              <p className="report-nav-current" aria-current="page">Resumen</p>
            </nav>
          </Card>
        </div>
        <div className="report-main">
          <PageHeader
            title="Resumen"
            subtitle={subtitle}
            actions={this.periodControl(report)}
          />
          {this.body(report)}
        </div>
        <Dialog
          open={report.customOpen}
          title="Personalizado"
          onClose={this.props.reportCustomClosed}
          initialFocusRef={this.focus}
          actions={<Button onClick={() => this.applyCustom()}>Aplicar</Button>}
        >
          <div className="report-range-fields">
            <TextField
              id="report-range-from"
              label="Desde"
              type="date"
              value={report.customFrom}
              onChange={event => this.props.reportCustomChanged({field: 'from', value: event.target.value})}
              inputRef={this.onFromRef}
              error={report.customError}
            />
            <TextField
              id="report-range-to"
              label="Hasta"
              type="date"
              value={report.customTo}
              onChange={event => this.props.reportCustomChanged({field: 'to', value: event.target.value})}
            />
          </div>
        </Dialog>
      </div>
    );
  }

  periodControl(report) {
    return (
      <div className="report-periods" role="group" aria-label="Periodo">
        {RANGE_CHIPS.map(chip => (
          <Button
            key={chip.key}
            variant={report.rangeKey === chip.key ? 'primary' : 'secondary'}
            pressed={report.rangeKey === chip.key}
            onClick={() => this.selectChip(chip.key)}
          >
            {chip.label}
          </Button>
        ))}
        <Button
          variant={report.rangeKey === 'custom' ? 'primary' : 'secondary'}
          pressed={report.rangeKey === 'custom'}
          onClick={this.props.reportCustomOpened}
        >
          Personalizado
        </Button>
      </div>
    );
  }

  body(report) {
    if (report.loading) {
      return <Spinner label="Cargando el resumen" />;
    }
    if (report.error) {
      return <EmptyState icon="exclamation-circle" title="No se ha podido cargar el resumen" message={report.error} />;
    }
    if (!report.summary) {
      return <EmptyState title="Sin ventas en este periodo" />;
    }
    return <SummaryView summary={report.summary} />;
  }

}
