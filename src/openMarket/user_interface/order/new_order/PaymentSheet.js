import React, {Component} from 'react';
import Dialog from '../../components/Dialog';
import Button from '../../components/Button';
import PluginSlot from '../../components/PluginSlot';
import Money from '../../../domain/money/Money';
import Payment from '../../../domain/payment/Payment';
import suggestedTenders from '../../../domain/payment/suggestedTenders';
import {formatMoney} from '../../i18n/money';
import {nextTenderCents} from './tenderCents';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'];

/**
 * Full-screen checkout. Tendered cents come from the keypad.
 */
export default class PaymentSheet extends Component {

  constructor(props) {
    super(props);
    this.panelRef = {current: null};
    this.onKeyDown = this.onKeyDown.bind(this);
    this.setPanel = this.setPanel.bind(this);
    this.confirm = this.confirm.bind(this);
  }

  setPanel(node) {
    this.panelRef.current = node;
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
      if (this.props.method === 'bizum') {
        return Payment.bizum({total});
      }
      const cents = this.props.tenderedCents;
      if (!Number.isInteger(cents) || cents <= 0) {
        return null;
      }
      if (this.props.method === 'mixed') {
        if (cents >= total.cents) {
          return null;
        }
        return Payment.mixed({
          total,
          parts: [
            {method: this.props.mixedFirst || 'cash', amountCents: cents},
            {method: this.props.mixedSecond || 'card', amountCents: total.cents - cents}
          ]
        });
      }
      return Payment.cash({total, tendered: Money.ofCents(cents)});
    } catch (error) {
      return null;
    }
  }

  /**
   * Enter charges with a ticket unless the till is set to never print.
   * @returns {boolean}
   */
  printsByDefault() {
    return this.props.printMode !== 'never';
  }

  /**
   * @param {boolean} print
   */
  confirm(print) {
    const payment = this.quoted();
    if (!payment || this.props.saving) {
      return;
    }
    if (this.props.onConfirm) {
      this.props.onConfirm(payment, print === true);
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
    this.confirm(this.printsByDefault());
  }

  /**
   * @param {string} key
   */
  onKey(key) {
    if (this.props.method === 'card' || this.props.method === 'bizum' || !this.props.onTendered) {
      return;
    }
    this.props.onTendered(nextTenderCents(this.props.tenderedCents, key));
  }

  /**
   * @param {Payment | null} payment
   * @returns {*}
   */
  footerActions(payment) {
    const disabled = !payment || !!this.props.saving;
    const mode = this.props.printMode === 'always' || this.props.printMode === 'never'
      ? this.props.printMode
      : 'ask';
    const primary = (
      <Button
        key="charge"
        type="button"
        disabled={disabled}
        onClick={() => this.confirm(mode !== 'never')}
      >
        {mode === 'never' ? 'Cobrar' : 'Cobrar e imprimir'}
      </Button>
    );
    if (mode !== 'ask') {
      return primary;
    }
    return [
      <Button
        key="quiet"
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={() => this.confirm(false)}
      >
        Sin ticket
      </Button>,
      primary
    ];
  }

  render() {
    const props = this.props;
    const total = this.total();
    const exact = props.method === 'card' || props.method === 'bizum';
    const mixed = props.method === 'mixed';
    const payment = this.quoted();
    const notes = suggestedTenders(total);
    const given = exact ? total : Money.ofCents(props.tenderedCents || 0);
    const short = !exact && props.tenderedCents > 0 && !payment;
    const change = payment ? Money.ofCents(payment.changeCents) : Money.ofCents(0);
    const title = props.nextInvoiceNumber ? 'Cobrar ticket nº ' + props.nextInvoiceNumber : 'Cobrar';
    return (
      <Dialog
        open={!!props.open}
        title={title}
        placement="fullscreen"
        className="payment-dialog"
        closeLabel="Volver"
        closeIcon="arrow-left"
        onClose={props.onClose}
        initialFocusRef={this.panelRef}
        actions={this.footerActions(payment)}
      >
        <div className="checkout" tabIndex="-1" ref={this.setPanel} onKeyDown={this.onKeyDown}>
          <div className="checkout-main">
            <div className="checkout-tiles">
              <Tile label="Total a cobrar" amount={total} />
              <Tile label="Entregado" amount={given} outlined />
              <Tile label="Cambio" amount={short ? null : change} change short={short} />
            </div>
            <div className="payment-methods" role="group" aria-label="Forma de pago">
              {['cash', 'card', 'bizum', 'mixed'].map(method => (
                <Button
                  key={method}
                  type="button"
                  variant={props.method === method ? 'primary' : 'secondary'}
                  pressed={props.method === method}
                  onClick={() => props.onMethod && props.onMethod(method)}
                >
                  {methodLabel(method)}
                </Button>
              ))}
            </div>
            {mixed ? (
              <div className="checkout-mixed">
                <PartSelect
                  label="Primera parte"
                  value={props.mixedFirst || 'cash'}
                  onChange={method => props.onPart && props.onPart('first', method)}
                />
                <PartSelect
                  label="Resto"
                  value={props.mixedSecond || 'card'}
                  onChange={method => props.onPart && props.onPart('second', method)}
                />
              </div>
            ) : null}
            {exact ? null : (
              <div className="checkout-entry">
                <div className="checkout-keypad" role="group" aria-label="Importe entregado">
                  {KEYS.map(key => (
                    <Button
                      key={key}
                      type="button"
                      variant="secondary"
                      label={key === 'back' ? 'Borrar' : undefined}
                      onClick={() => this.onKey(key)}
                    >
                      {key === 'back' ? '⌫' : key}
                    </Button>
                  ))}
                </div>
                <div className="payment-notes">
                  <p className="checkout-notes-label">Importe rápido</p>
                  {notes.map((note, index) => (
                    <Button
                      type="button"
                      variant="secondary"
                      key={note.cents}
                      onClick={() => props.onTendered && props.onTendered(note.cents)}
                    >
                      {index === 0 ? 'Exacto ' + formatMoney(note) : formatMoney(note)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {short ? <p className="payment-short">Entregado insuficiente</p> : null}
            <PluginSlot name="sell.payment.after" />
          </div>
          <aside className="checkout-preview">
            <p className="checkout-preview-title">Vista previa del ticket</p>
            {props.previewHtml ? (
              <div className="om-receipt-preview" dangerouslySetInnerHTML={{__html: props.previewHtml}} />
            ) : (
              <p className="payment-preview-wait">Preparando el ticket…</p>
            )}
          </aside>
        </div>
      </Dialog>
    );
  }

}

/**
 * @param {string} method
 * @returns {string}
 */
function methodLabel(method) {
  if (method === 'card') {
    return 'Tarjeta';
  }
  if (method === 'bizum') {
    return 'Bizum';
  }
  if (method === 'mixed') {
    return 'Mixto';
  }
  return 'Efectivo';
}

/**
 * @param {{label: string, value: string, onChange: function(string): void}} props
 */
function PartSelect(props) {
  return (
    <label className="checkout-part">
      <span>{props.label}</span>
      <select value={props.value} onChange={event => props.onChange(event.target.value)}>
        <option value="cash">Efectivo</option>
        <option value="card">Tarjeta</option>
        <option value="bizum">Bizum</option>
      </select>
    </label>
  );
}

/**
 * @param {{label: string, amount: Money | null, outlined?: boolean, change?: boolean, short?: boolean}} props
 */
function Tile(props) {
  const classes = ['checkout-tile'];
  if (props.outlined) {
    classes.push('checkout-tile-given');
  }
  if (props.change) {
    classes.push(props.short ? 'checkout-tile-change is-short' : 'checkout-tile-change');
  }
  return (
    <div className={classes.join(' ')}>
      <span>{props.label}</span>
      <span className="sell-total">{props.amount ? formatMoney(props.amount) : ''}</span>
    </div>
  );
}
