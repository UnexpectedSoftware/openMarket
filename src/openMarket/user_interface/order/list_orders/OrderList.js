import React from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import Skeleton from '../../components/Skeleton';
import Money from '../../../domain/money/Money';
import {formatMoney} from '../../i18n/money';
import {orderMeta} from './format';

/**
 * @param {{items?: object[], total?: number, loading?: boolean, loadingMore?: boolean, error?: string, selectedOrderId?: string | null, onOpen: Function, onLoadMore: Function, onRetry: Function}} props
 */
export default function OrderList(props) {
  const items = props.items || [];
  if (props.loading && items.length === 0) {
    return (
      <Card>
        <Skeleton lines={6} />
      </Card>
    );
  }
  return (
    <Card>
      {listBody(props, items)}
      {showMore(items, props.total) ? (
        <div className="orders-more">
          <Button variant="secondary" busy={props.loadingMore} onClick={props.onLoadMore}>Cargar más</Button>
        </div>
      ) : null}
    </Card>
  );
}

/**
 * @param {object[]} items
 * @param {number | undefined} total
 * @returns {boolean}
 */
function showMore(items, total) {
  return items.length > 0 && items.length < total;
}

/**
 * @param {{error?: string, selectedOrderId?: string | null, onOpen: Function, onRetry: Function}} props
 * @param {object[]} items
 */
function listBody(props, items) {
  if (props.error && items.length === 0) {
    return <OrderListError message={props.error} onRetry={props.onRetry} />;
  }
  if (items.length === 0) {
    return <EmptyState icon="list-alt" title="No hay pedidos en este periodo" />;
  }
  return (
    <div>
      {props.error ? <OrderListError message={props.error} onRetry={props.onRetry} /> : null}
      <ul className="orders-rows">
        {items.map(item => (
          <OrderRow
            key={item.orderId}
            item={item}
            selected={item.orderId === props.selectedOrderId}
            onOpen={props.onOpen}
          />
        ))}
      </ul>
    </div>
  );
}

/**
 * @param {{message: string, onRetry: Function}} props
 */
function OrderListError(props) {
  return (
    <div className="orders-error-row">
      <p className="orders-error" role="alert">{props.message}</p>
      <Button variant="secondary" onClick={props.onRetry}>Reintentar</Button>
    </div>
  );
}

/**
 * @param {{item: object, selected: boolean, onOpen: Function}} props
 */
function OrderRow(props) {
  const item = props.item;
  const classes = props.selected ? 'orders-row is-selected' : 'orders-row';
  return (
    <li>
      <button
        type="button"
        className={classes}
        aria-pressed={props.selected ? 'true' : 'false'}
        onClick={() => props.onOpen(item.orderId)}
      >
        <span className="orders-row-copy">
          <span className="orders-row-invoice">
            <span>{item.invoiceNumber}</span>
            {item.cancelled ? <Badge tone="danger">Anulada</Badge> : null}
          </span>
          <span className="orders-row-meta">{orderMeta(item)}</span>
        </span>
        <span className="orders-row-total">{formatMoney(Money.ofCents(item.totalCents))}</span>
      </button>
    </li>
  );
}
