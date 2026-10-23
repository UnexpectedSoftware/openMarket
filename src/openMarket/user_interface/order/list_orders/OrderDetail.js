import React, {Component} from 'react';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import Dialog from '../../components/Dialog';
import EmptyState from '../../components/EmptyState';
import Skeleton from '../../components/Skeleton';
import PluginSlot from '../../components/PluginSlot';
import Money from '../../../domain/money/Money';
import {formatMoney} from '../../i18n/money';
import {formatKg, orderWhen, paymentLine, vatLabel, weightedPrice} from './format';

const COLUMNS = [
  {key: 'name', header: 'Producto'},
  {key: 'price', header: 'Precio', render: priceCell},
  {key: 'quantity', header: 'Cantidad', align: 'end', render: quantityCell},
  {key: 'amount', header: 'Importe', align: 'end', render: amountCell}
];

/**
 * @param {{status?: string, detail?: object | null, error?: string, onReprint: Function, onRetry: Function}} props
 */
export default function OrderDetail(props) {
  if (props.status === 'missing') {
    return <EmptyState icon="file-text-o" title="Pedido no encontrado" />;
  }
  if (props.status === 'error') {
    return (
      <div>
        <EmptyState icon="exclamation-triangle" title={props.error || 'No se ha podido abrir el pedido'} />
        <Button variant="secondary" onClick={props.onRetry}>Reintentar</Button>
      </div>
    );
  }
  if (!props.detail) {
    return <Skeleton lines={6} />;
  }
  return <OrderDetailBody detail={props.detail} onReprint={props.onReprint} />;
}

/**
 * @param {{detail: object, onReprint: Function}} props
 */
function OrderDetailBody(props) {
  const detail = props.detail;
  const when = orderWhen(detail.createdAt);
  const rows = (detail.lines || []).map((line, index) => ({...line, key: String(index)}));
  return (
    <section className="orders-detail-pane" aria-label="Detalle del pedido">
      <div className="orders-detail-scroll">
        <p className="orders-detail-kicker">Factura simplificada</p>
        <h2 className="orders-detail-heading">
          <span className="orders-detail-number">{detail.invoiceNumber}</span>
          {detail.cancelled ? <Badge tone="danger">Anulada</Badge> : null}
          <span className="orders-detail-when">{when}</span>
        </h2>
        <p className="orders-detail-payment">{paymentLine(detail.payment)}</p>
        <DataTable columns={COLUMNS} rows={rows} rowKey="key" />
        <ul className="orders-detail-vat">
          {(detail.vat || []).map((row, index) => (
            <li key={vatLabel(row) + '-' + index}>
              <span>{vatLabel(row)}</span>
              <span className="orders-money">{formatMoney(Money.ofCents(row.baseCents))}</span>
              <span className="orders-money">{formatMoney(Money.ofCents(row.quotaCents))}</span>
            </li>
          ))}
        </ul>
        <p className="orders-detail-total">{formatMoney(Money.ofCents(detail.totalCents))}</p>
        <div className="orders-detail-aside">
          <PluginSlot name="orders.detail.aside" />
        </div>
      </div>
      <div className="orders-detail-actions">
        <Button variant="secondary" icon="print" onClick={props.onReprint}>Reimprimir</Button>
      </div>
    </section>
  );
}

/**
 * Loads the order named by the child route.
 */
export class OrderDetailRoute extends Component {

  componentWillMount() {
    this.load(this.props.params && this.props.params.id);
  }

  componentWillReceiveProps(next) {
    const previous = this.props.params && this.props.params.id;
    const id = next.params && next.params.id;
    if (id !== previous) {
      this.load(id);
    }
  }

  load(id) {
    if (id && this.props.orderDetailRequested) {
      this.props.orderDetailRequested(id);
    }
  }

  reprint() {
    const id = this.props.params && this.props.params.id;
    if (id && this.props.orderReprintRequested) {
      this.props.orderReprintRequested(id);
    }
  }

  render() {
    const orders = this.props.orders || {};
    return (
      <OrderDetail
        status={orders.detailStatus}
        detail={orders.detail}
        error={orders.detailError}
        onReprint={() => this.reprint()}
        onRetry={() => this.load(this.props.params && this.props.params.id)}
      />
    );
  }

}

/**
 * HTML preview of a ticket. Imprimir sends it to the printer.
 * @param {{open: boolean, html?: string, error?: string, busy?: boolean, onClose: Function, onPrint: Function}} props
 */
export function ReprintDialog(props) {
  return (
    <Dialog
      open={props.open}
      title="Ticket"
      onClose={props.onClose}
      actions={(
        <Button type="button" icon="print" busy={props.busy} onClick={props.onPrint}>Imprimir</Button>
      )}
    >
      <div>
        {props.error ? <p className="orders-error" role="alert">{props.error}</p> : null}
        {props.html ? (
          <div className="om-receipt-preview" dangerouslySetInnerHTML={{__html: props.html}} />
        ) : null}
        {!props.html && !props.error ? <p className="payment-preview-wait">Preparando el ticket…</p> : null}
      </div>
    </Dialog>
  );
}

/**
 * @param {{weighted?: boolean, unitPriceCents?: number, quantityMilli?: number}} line
 * @returns {string}
 */
function priceCell(line) {
  if (line.weighted) {
    return weightedPrice(line);
  }
  return formatMoney(Money.ofCents(line.unitPriceCents || 0));
}

/**
 * @param {{kind?: string, weighted?: boolean, quantityMilli?: number}} line
 * @returns {string}
 */
function quantityCell(line) {
  if (line.kind === 'FREE') {
    return '1';
  }
  if (line.weighted) {
    return formatKg(line.quantityMilli) + ' kg';
  }
  const milli = Number(line.quantityMilli) || 0;
  return String(Math.trunc(milli / 1000));
}

/**
 * @param {{amountCents?: number}} line
 * @returns {string}
 */
function amountCell(line) {
  return formatMoney(Money.ofCents(line.amountCents || 0));
}
