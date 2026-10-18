import React, {Component} from 'react';
import Dialog from '../../components/Dialog';
import Button from '../../components/Button';
import NumberField from '../../components/NumberField';
import PluginSlot from '../../components/PluginSlot';
import Money from '../../../domain/money/Money';
import Payment from '../../../domain/payment/Payment';
import suggestedTenders from '../../../domain/payment/suggestedTenders';
import {formatMoney} from '../../i18n/money';

/**
 * Cobrar. The change uses Payment, the same check CreateOrder saves.
 */
export default class PaymentSheet extends Component {

  constructor(props) {
    super(props);
    this.tenderedRef = {current: null};
    this.onKeyDown = this.onKeyDown.bind(this);
    this.setTenderedNode = this.setTenderedNode.bind(this);
    this.confirm = this.confirm.bind(this);
  }

  setTenderedNode(node) {
    this.tenderedRef.current = node;
  }

  total() {
    return this.props.total instanceof Money ? this.props.total : Money.ofCents(0);
  }

  /**
   * @returns {Payment | null}
   */
  quoted() {
    const total = this.total();
    try {
      if (this.props.method === 'card') {
        return Payment.card({total});
      }
      if (this.props.tendered === '' || this.props.tendered == null) {
        return null;
      }
      return Payment.cash({total, tendered: this.props.tendered});
    } catch (error) {
      return null;
    }
  }

  confirm() {
    const payment = this.quoted();
    if (!payment || this.props.saving) {
      return;
    }
    if (this.props.onConfirm) {
      this.props.onConfirm(payment);
    }
  }

  onKeyDown(event) {
    if (event.key !== 'Enter') {
      return;
    }
    const tag = event.target && event.target.tagName;
    if (tag === 'BUTTON') {
      return;
    }
    event.preventDefault();
    this.confirm();
  }

  render() {
    const props = this.props;
    const total = this.total();
    const card = props.method === 'card';
    const payment = this.quoted();
    const notes = suggestedTenders(total);
    const short = !card && props.tendered !== '' && props.tendered != null && !payment;
    const previewOpen = props.previewOpen !== false;
    return (
      <Dialog
        open={!!props.open}
        title="Cobrar"
        className="payment-dialog"
        onClose={props.onClose}
        initialFocusRef={this.tenderedRef}
        actions={(
          <Button type="button" disabled={!payment || !!props.saving} onClick={this.confirm}>
            Confirmar (Enter)
          </Button>
        )}
      >
        <div className="payment-sheet" onKeyDown={this.onKeyDown}>
          <div className="payment-methods" role="group" aria-label="Forma de pago">
            <Button
              type="button"
              variant={card ? 'secondary' : 'primary'}
              onClick={() => props.onMethod && props.onMethod('cash')}
            >
              Efectivo
            </Button>
            <Button
              type="button"
              variant={card ? 'primary' : 'secondary'}
              onClick={() => props.onMethod && props.onMethod('card')}
            >
              Tarjeta
            </Button>
          </div>
          <p className="payment-total">
            <span>Total</span>
            <span className="sell-total">{formatMoney(total)}</span>
          </p>
          <NumberField
            id="payment-tendered"
            label="Entregado"
            unit="€"
            decimals={2}
            value={card ? total.toEuros() : props.tendered}
            readOnly={card}
            onChange={card ? undefined : props.onTendered}
            inputRef={this.setTenderedNode}
          />
          {card || !notes.length ? null : (
            <div className="payment-notes">
              <Button type="button" variant="secondary" onClick={() => props.onTendered && props.onTendered(notes[0].toEuros())}>
                Exacto
              </Button>
              {notes.slice(1).map(note => (
                <Button
                  type="button"
                  variant="secondary"
                  key={note.cents}
                  onClick={() => props.onTendered && props.onTendered(note.toEuros())}
                >
                  {formatMoney(note)}
                </Button>
              ))}
            </div>
          )}
          <p className={short ? 'payment-change is-short' : 'payment-change'}>
            <span>Cambio</span>
            <span className="sell-total">{payment ? formatMoney(Money.ofCents(payment.changeCents)) : ''}</span>
          </p>
          {short ? <p className="payment-short">Entregado insuficiente</p> : null}
          <PluginSlot name="sell.payment.after" />
          <Button
            type="button"
            variant="ghost"
            expanded={previewOpen}
            onClick={props.onTogglePreview}
          >
            Vista previa del ticket
          </Button>
          {previewOpen ? (
            props.previewHtml ? (
              <div className="om-receipt-preview" dangerouslySetInnerHTML={{__html: props.previewHtml}} />
            ) : (
              <p className="payment-preview-wait">Preparando el ticket…</p>
            )
          ) : null}
        </div>
      </Dialog>
    );
  }

}
