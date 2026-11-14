import React from 'react';
import Money from '../../domain/money/Money';
import Card from '../components/Card';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import {formatMoney} from '../i18n/money';
import {axisLabels, formatBucketTooltip, formatChange, formatSalesGap, formatStock, formatUnits} from './format';

const TOTALS_AT = 12;
const CHART_TITLES = {
  day: 'Ventas por día',
  week: 'Ventas por semana',
  month: 'Ventas por mes'
};

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
          <Card title={chartTitle(summary.grain)} actions={<Legend />}>
            <SalesChart summary={summary} />
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
 * @param {string} grain
 * @returns {string}
 */
function chartTitle(grain) {
  return CHART_TITLES[grain] || CHART_TITLES.day;
}

/**
 * @param {number} index
 * @param {number} count
 * @returns {string}
 */
function edgeClass(index, count) {
  if (count < 2) {
    return '';
  }
  if (index === 0) {
    return ' is-start';
  }
  if (index === count - 1) {
    return ' is-end';
  }
  return '';
}

/**
 * @param {{summary: {grain: string, buckets: SalesBucket[], firstSale: string|null, lastSale: string|null}}} props
 */
function SalesChart(props) {
  const summary = props.summary;
  const buckets = summary.buckets || [];
  if (!buckets.length) {
    return <EmptyState title="Sin ventas en este periodo" />;
  }
  const max = buckets.reduce((highest, bucket) => {
    return Math.max(highest, bucketTotal(bucket), bucket.previousTotalCents);
  }, 0);
  const labels = axisLabels(buckets, summary.grain);
  const caption = formatSalesGap(summary);
  const showTotals = buckets.length <= TOTALS_AT;
  return (
    <div className="report-chart">
      <div className="report-columns">
        {buckets.map((bucket, index) => (
          <BucketColumn
            key={bucket.from}
            bucket={bucket}
            max={max}
            label={labels[index]}
            showTotal={showTotals}
            grain={summary.grain}
            edge={edgeClass(index, buckets.length)}
          />
        ))}
      </div>
      {caption ? <p className="report-chart-note">{caption}</p> : null}
    </div>
  );
}

/**
 * @param {{bucket: SalesBucket, max: number, label: string, showTotal: boolean, grain: string, edge: string}} props
 */
function BucketColumn(props) {
  const bucket = props.bucket;
  const total = bucketTotal(bucket);
  const amount = total ? formatMoney(Money.ofCents(total)) : '';
  return (
    <div className="report-column" title={formatBucketTooltip(bucket, props.grain)}>
      {props.showTotal ? <p className="report-column-total">{amount || '\u00a0'}</p> : null}
      <div className="report-plot">
        <div className="report-stack">
          <Segment className="report-segment-bizum" cents={bucket.bizumCents} max={props.max} />
          <Segment className="report-segment-card" cents={bucket.cardCents} max={props.max} />
          <Segment className="report-segment-cash" cents={bucket.cashCents} max={props.max} />
        </div>
        <div className="report-previous" style={{bottom: percent(bucket.previousTotalCents, props.max)}} />
      </div>
      <p className={'report-column-day' + props.edge}>{props.label ? <span>{props.label}</span> : '\u00a0'}</p>
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
 * @typedef {object} SalesBucket
 * @property {string} from
 * @property {string} to
 * @property {number} cashCents
 * @property {number} cardCents
 * @property {number} bizumCents
 * @property {number} previousTotalCents
 */

/**
 * @param {{cashCents: number, cardCents: number, bizumCents: number}} bucket
 * @returns {number}
 */
function bucketTotal(bucket) {
  return bucket.cashCents + bucket.cardCents + bucket.bizumCents;
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
