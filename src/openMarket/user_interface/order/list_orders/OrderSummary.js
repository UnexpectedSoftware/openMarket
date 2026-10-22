import React from 'react';
import Card from '../../components/Card';
import Money from '../../../domain/money/Money';
import {formatMoney} from '../../i18n/money';

const EMPTY = {totalCents: 0, ticketCount: 0, averageCents: 0};

/**
 * @param {{summary?: {totalCents?: number, ticketCount?: number, averageCents?: number}}} props
 */
export default function OrderSummary(props) {
  const summary = props.summary || EMPTY;
  return (
    <Card>
      <dl className="orders-summary">
        <div className="orders-summary-fact">
          <dt>Ventas</dt>
          <dd>{formatMoney(Money.ofCents(summary.totalCents || 0))}</dd>
        </div>
        <div className="orders-summary-fact">
          <dt>Tickets</dt>
          <dd>{summary.ticketCount || 0}</dd>
        </div>
        <div className="orders-summary-fact">
          <dt>Ticket medio</dt>
          <dd>{formatMoney(Money.ofCents(summary.averageCents || 0))}</dd>
        </div>
      </dl>
    </Card>
  );
}
