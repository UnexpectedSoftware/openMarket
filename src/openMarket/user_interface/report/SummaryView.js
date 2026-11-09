import React from 'react';
import Money from '../../domain/money/Money';
import Card from '../components/Card';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import {formatMoney} from '../i18n/money';
import {formatChange, formatDay, formatDayNumber, formatStock, formatUnits} from './format';

const COMPACT_DAYS = 12;

/**
 * @param {{summary: object}} props
 */
export default function SummaryView(props) {
  const summary = props.summary;
  return (
    <div className="report-body">
      <div className="report-kpis">
        <Kpi label="Ventas" value={formatMoney(Money.ofCents(summary.salesCents))} ratio={summary.salesChange} />
        <Kpi label="Tickets" value={String(summary.ticketCount)} ratio={summary.ticketChange} />
        <Kpi label="Ticket medio" value={formatMoney(Money.ofCents(summary.averageCents))} ratio={summary.averageChange} />
        <Kpi label="Unidades" value={formatUnits(summary.units)} ratio={summary.unitsChange} />
      </div>
      <div className="report-split">
        <div className="report-chart-card">
          <Card title="Ventas por día" actions={<Legend />}>
            <DailyChart days={summary.days} />
          </Card>
        </div>
        <div className="report-side">
          <Card>
            <h2 className="report-section-title">Más vendidos</h2>
            <MostSold rows={summary.mostSold} />
          </Card>
          <Card>
            <h2 className="report-section-title">Stock bajo</h2>
            <LowStock stock={summary.lowStock} />
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{label: string, value: string, ratio: number | null}} props
 */
function Kpi(props) {
  return (
    <Card>
      <p className="report-kpi-label">{props.label}</p>
      <p className="report-kpi-value">{props.value}</p>
      <p className="report-kpi-meta">
        <Change ratio={props.ratio} />
        <span> vs periodo anterior</span>
      </p>
    </Card>
  );
}

/**
 * @param {{ratio: number | null}} props
 */
function Change(props) {
  const change = formatChange(props.ratio);
  if (!change) {
    return <span>—</span>;
  }
  const className = change.direction === 'down' ? 'report-change-down' : 'report-change-up';
  return <span className={className}>{change.text}</span>;
}

function Legend() {
  return (
    <ul className="report-legend">
      <li><span className="report-swatch report-swatch-cash" /> Efectivo</li>
      <li><span className="report-swatch report-swatch-card" /> Tarjeta</li>
      <li><span className="report-swatch report-swatch-bizum" /> Bizum</li>
      <li><span className="report-swatch report-swatch-previous" /> periodo anterior</li>
    </ul>
  );
}

/**
 * @param {{days: Array<{date: string, cashCents: number, cardCents: number, bizumCents: number, previousTotalCents: number}>}} props
 */
function DailyChart(props) {
  const days = props.days || [];
  const max = days.reduce((highest, day) => Math.max(highest, dayTotal(day), day.previousTotalCents), 0);
  if (!days.length || max === 0) {
    return <EmptyState title="Sin ventas en este periodo" />;
  }
  const compact = days.length > COMPACT_DAYS;
  const className = compact ? 'report-columns is-compact' : 'report-columns';
  return (
    <div className="report-chart-scroll">
      <div className={className}>
        {days.map(day => (
          <DayColumn key={day.date} day={day} max={max} compact={compact} />
        ))}
      </div>
    </div>
  );
}

/**
 * @param {{day: {date: string, cashCents: number, cardCents: number, bizumCents: number, previousTotalCents: number}, max: number, compact: boolean}} props
 */
function DayColumn(props) {
  const day = props.day;
  const total = dayTotal(day);
  const amount = total ? formatMoney(Money.ofCents(total)) : '';
  const label = props.compact ? formatDayNumber(day.date) : formatDay(day.date);
  return (
    <div className="report-column" title={amount ? label + ' ' + amount : label}>
      {props.compact ? null : <p className="report-column-total">{amount || ' '}</p>}
      <div className="report-plot">
        <div className="report-stack">
          <Segment className="report-segment-bizum" cents={day.bizumCents} max={props.max} />
          <Segment className="report-segment-card" cents={day.cardCents} max={props.max} />
          <Segment className="report-segment-cash" cents={day.cashCents} max={props.max} />
        </div>
        <div className="report-previous" style={{bottom: percent(day.previousTotalCents, props.max)}} />
      </div>
      <p className="report-column-day">{label}</p>
    </div>
  );
}

/**
 * @param {{className: string, cents: number, max: number}} props
 */
function Segment(props) {
  if (!props.cents) {
    return null;
  }
  return <div className={'report-segment ' + props.className} style={{height: percent(props.cents, props.max)}} />;
}

/**
 * @param {{rows: Array<{barcode: string, name: string, quantity: number, amountCents: number}>}} props
 */
function MostSold(props) {
  const rows = props.rows || [];
  if (!rows.length) {
    return <p className="report-empty">Sin ventas en este periodo.</p>;
  }
  return (
    <table className="report-table">
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.barcode}>
            <td className="report-rank">{index + 1}</td>
            <td>{row.name}</td>
            <td className="report-num">{formatUnits(row.quantity)}</td>
            <td className="report-num">{formatMoney(Money.ofCents(row.amountCents))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * @param {{stock: {total: number, items: Array<{barcode: string, name: string, stock: number | null, stockMin: number | null, weighted: boolean}>}}} props
 */
function LowStock(props) {
  const stock = props.stock || {total: 0, items: []};
  if (!stock.total) {
    return <p className="report-empty">Ningún producto está bajo de stock.</p>;
  }
  return (
    <div>
      <p className="report-stock-count">{stock.total === 1 ? '1 producto' : stock.total + ' productos'}</p>
      <ul className="report-stock">
        {stock.items.map(item => (
          <li key={item.barcode} className="report-stock-row">
            <span>{item.name}</span>
            <Badge tone={item.stock === 0 ? 'danger' : 'warning'}>
              {formatStock(item.stock, item.weighted)}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * @param {{cashCents: number, cardCents: number, bizumCents: number}} day
 * @returns {number}
 */
function dayTotal(day) {
  return day.cashCents + day.cardCents + day.bizumCents;
}

/**
 * @param {number} cents
 * @param {number} max
 * @returns {string}
 */
function percent(cents, max) {
  if (!max) {
    return '0%';
  }
  return (cents / max * 100) + '%';
}
