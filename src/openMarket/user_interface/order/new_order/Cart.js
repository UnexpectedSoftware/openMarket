import React, {Component} from 'react';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import IconButton from '../../components/IconButton';
import NumberField from '../../components/NumberField';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import Money from '../../../domain/money/Money';
import Quantity from '../../../domain/money/Quantity';
import {formatMoney} from '../../i18n/money';
import PluginSlot from '../../components/PluginSlot';
import {lineAmount, lineIsValid, ticketFacts} from './model';
import {formatQuantity, lineCaption, ticketCountLabel, vatIncludedLabel} from './caption';
import {lineQuedan} from '../../low_stock/label';
import Keypad from './Keypad';
import {nextKeypadQuantity} from './keypadQuantity';

/**
 * Ticket panel. The quantity input stays a NumberField so a sale test can read it.
 */
export default class Cart extends Component {

  constructor(props) {
    super(props);
    this.state = {confirmClear: false};
    this.confirmRef = {current: null};
    this.onCharge = this.onCharge.bind(this);
    this.onKey = this.onKey.bind(this);
    this.askClear = this.askClear.bind(this);
    this.cancelClear = this.cancelClear.bind(this);
    this.confirmClear = this.confirmClear.bind(this);
    this.setConfirmNode = this.setConfirmNode.bind(this);
  }

  onCharge() {
    if (this.props.onCharge) {
      this.props.onCharge();
    }
  }

  askClear() {
    this.setState({confirmClear: true});
  }

  cancelClear() {
    this.setState({confirmClear: false});
  }

  confirmClear() {
    this.setState({confirmClear: false});
    if (this.props.onClear) {
      this.props.onClear();
    }
  }

  setConfirmNode(node) {
    this.confirmRef.current = node ? node.querySelector('button') : null;
  }

  render() {
    const lines = linesOf(this.props.order);
    const facts = ticketFacts(lines);
    const total = this.props.order && this.props.order.total ? this.props.order.total : Money.ofCents(0);
    return (
      <section className="sell-cart" aria-label="Ticket">
        <TicketHead
          facts={facts}
          canClear={lines.length > 0}
          onClear={this.askClear}
        />
        <div className="sell-lines">
          {lines.length === 0 ? (
            <EmptyState icon="shopping-basket" title="El ticket está vacío" />
          ) : lines.map((line, index) => (
            <TicketLine
              key={(line.barcode || 'free') + '-' + index}
              line={line}
              index={index}
              selected={this.props.selected}
              lowSet={this.props.lowStockBarcodes || []}
              onSelect={this.props.onSelect}
              onQuantityChange={this.props.onQuantityChange}
              onChanged={this.props.onChanged}
              onEditWeighted={this.props.onEditWeighted}
              onDelete={this.props.onDelete}
            />
          ))}
        </div>
        {this.props.keypad ? <Keypad onKey={this.onKey} /> : null}
        <TicketFooter
          facts={facts}
          total={total}
          canCharge={lines.length > 0 && lines.every(lineIsValid)}
          onCharge={this.onCharge}
        />
        <Dialog
          open={this.state.confirmClear && lines.length > 0}
          role="alertdialog"
          title="Vaciar ticket"
          onClose={this.cancelClear}
          initialFocusRef={this.confirmRef}
          actions={(
            <span className="sell-clear-actions">
              <Button type="button" variant="secondary" onClick={this.cancelClear}>Cancelar</Button>
              <span ref={this.setConfirmNode}>
                <Button type="button" variant="danger" onClick={this.confirmClear}>Vaciar</Button>
              </span>
            </span>
          )}
        >
          <p>Se quitarán todas las líneas del ticket.</p>
        </Dialog>
      </section>
    );
  }

  onKey(key) {
    const lines = linesOf(this.props.order);
    const index = selectedIndex(this.props.selected, lines.length);
    const line = lines[index];
    if (!line || line.kind === 'FREE' || line.weighted || !this.props.onQuantityChange) {
      return;
    }
    this.props.onQuantityChange({
      barcode: line.barcode,
      quantityChanged: nextKeypadQuantity(quantityText(line), key)
    });
    if (this.props.onChanged) {
      this.props.onChanged();
    }
  }

}

/**
 * @param {{facts: object, canClear: boolean, onClear: Function}} props
 */
export function TicketHead(props) {
  return (
    <header className="sell-ticket-head">
      <div>
        <h2 className="sell-ticket-title">Ticket</h2>
        <p className="sell-ticket-count">{ticketCountLabel(props.facts)}</p>
      </div>
      <div className="sell-ticket-tools">
        <Button type="button" variant="secondary" disabled>Cliente</Button>
        <IconButton
          icon="trash"
          label="Vaciar ticket"
          variant="ghost"
          disabled={!props.canClear}
          onClick={props.onClear}
        />
      </div>
    </header>
  );
}

/**
 * @param {{facts: object, total: Money, canCharge: boolean, onCharge: Function}} props
 */
export function TicketFooter(props) {
  const totalText = formatMoney(props.total);
  return (
    <footer className="sell-footer">
      <div className="order-vat">
        <p className="sell-sum">
          <span>Base imponible</span>
          <span className="sell-money">{formatMoney(Money.ofCents(props.facts.baseCents))}</span>
        </p>
        <p className="sell-sum">
          <span>{vatIncludedLabel(props.facts.rates)}</span>
          <span className="sell-money">{formatMoney(Money.ofCents(props.facts.quotaCents))}</span>
        </p>
      </div>
      <div className="order-total">
        <span>Total</span>
        <span className="sell-total">{totalText}</span>
      </div>
      <PluginSlot name="sell.cart.footer" />
      <div className="sell-ticket-actions">
        <Button type="button" variant="secondary" icon="pause" disabled>Aparcar</Button>
        <Button type="button" variant="secondary" icon="percent" disabled>Descuento</Button>
        <Button type="button" variant="secondary" icon="inbox" disabled>Cajón</Button>
      </div>
      <Button type="button" className="sell-charge" size="lg" disabled={!props.canCharge} onClick={props.onCharge}>
        {'Cobrar ' + totalText}
        <span className="sell-kbd">F12</span>
      </Button>
    </footer>
  );
}

/**
 * @param {{line: object, index: number, selected?: number, lowSet?: string[], onSelect?: Function, onQuantityChange?: Function, onChanged?: Function, onEditWeighted?: Function}} props
 */
export function TicketLine(props) {
  const line = props.line;
  const valid = lineIsValid(line);
  const quedan = lineQuedan(line, props.lowSet || []);
  const weighted = !!line.weighted;
  const free = line.kind === 'FREE';
  return (
    <div
      className={lineClass(valid, props.selected === props.index)}
      aria-invalid={valid ? undefined : 'true'}
      onClick={() => props.onSelect && props.onSelect(props.index)}
    >
      <div className="sell-line-main">
        <span className="sell-line-title">{line.name}</span>
        <span className="sell-line-meta">{lineCaption(line)}</span>
        {quedan && !free ? <Badge tone="warning">{quedan}</Badge> : null}
        {valid ? null : <Badge tone="danger">Cantidad no válida</Badge>}
      </div>
      <div className="sell-line-qty">
        {weighted ? (
          <button
            type="button"
            className="sell-weight"
            aria-label={'Peso ' + formatQuantity(line.quantity, 3) + ' kg'}
            onClick={() => editWeight(props.onEditWeighted, line)}
          >
            <i className="fa fa-balance-scale" aria-hidden="true" />
            <span>{formatQuantity(line.quantity, 3)}</span>
          </button>
        ) : null}
        {stepperFor(line, props)}
        {rowTrash(line, props)}
      </div>
      <span className="sell-money sell-line-subtotal">{formatMoney(lineAmount(line))}</span>
    </div>
  );
}

/**
 * @param {boolean} valid
 * @param {boolean} selected
 * @returns {string}
 */
function lineClass(valid, selected) {
  const classes = ['sell-line'];
  if (!valid) {
    classes.push('is-invalid');
  }
  if (selected) {
    classes.push('is-selected');
  }
  return classes.join(' ');
}

/**
 * @param {object} line
 * @param {object} props
 */
function stepperFor(line, props) {
  const weighted = !!line.weighted;
  const free = line.kind === 'FREE';
  const field = (
    <NumberField
      id={'sell-qty-' + props.index}
      name="quantity"
      label="Cantidad"
      decimals={weighted ? 3 : 0}
      value={quantityText(line)}
      readOnly={weighted || free}
      onFocus={weighted ? () => editWeight(props.onEditWeighted, line) : undefined}
      onChange={weighted || free ? undefined : value => changeQuantity(props, line, value)}
    />
  );
  if (weighted || free) {
    return <div className="sell-weight-field">{field}</div>;
  }
  return (
    <div className="sell-stepper">
      {singleUnit(line) ? (
        <IconButton icon="trash" label="Quitar" variant="ghost" onClick={() => removeLine(props, line)} />
      ) : (
        <IconButton icon="minus" label="Menos" onClick={() => step(props, line, -1)} />
      )}
      {field}
      <IconButton icon="plus" label="Más" onClick={() => step(props, line, 1)} />
    </div>
  );
}

/**
 * A weighed or free line has no stepper, so the row carries its own trash.
 * @param {object} line
 * @param {object} props
 */
function rowTrash(line, props) {
  if (!line.weighted && line.kind !== 'FREE') {
    return null;
  }
  return <IconButton icon="trash" label="Quitar" variant="ghost" onClick={() => removeLine(props, line)} />;
}

/**
 * One unit is the last press of −. Zero is already invalid, so the same control removes it.
 * @param {object} line
 * @returns {boolean}
 */
function singleUnit(line) {
  const milli = line && line.quantity && line.quantity.milli;
  return milli === 1000 || milli === 0;
}

/**
 * @param {object} props
 * @param {object} line
 */
function removeLine(props, line) {
  if (props.onDelete) {
    props.onDelete(line.barcode, props.index);
  }
  if (props.onChanged) {
    props.onChanged();
  }
}

/**
 * @param {Function | undefined} onEditWeighted
 * @param {object} line
 */
function editWeight(onEditWeighted, line) {
  if (onEditWeighted) {
    onEditWeighted(line);
  }
}

/**
 * @param {object} props
 * @param {object} line
 * @param {number | string} value
 */
function changeQuantity(props, line, value) {
  if (props.onQuantityChange) {
    props.onQuantityChange({barcode: line.barcode, quantityChanged: value});
  }
}

/**
 * @param {object} props
 * @param {object} line
 * @param {number} delta
 */
function step(props, line, delta) {
  const next = line.quantity.plus(Quantity.from(delta));
  const units = next.milli < 0 ? 0 : next.units;
  changeQuantity(props, line, units);
  if (props.onChanged) {
    props.onChanged();
  }
}

/**
 * @param {object | null | undefined} order
 * @returns {object[]}
 */
function linesOf(order) {
  return (order && order.lines) || [];
}

/**
 * @param {number} selected
 * @param {number} count
 * @returns {number}
 */
function selectedIndex(selected, count) {
  if (count === 0) {
    return -1;
  }
  if (typeof selected === 'number' && selected >= 0 && selected < count) {
    return selected;
  }
  return count - 1;
}

/**
 * @param {{kind?: string, quantity?: {units: number, milli: number}, weighted?: boolean}} line
 * @returns {string}
 */
function quantityText(line) {
  if (!line || !line.quantity || typeof line.quantity.units !== 'number') {
    return '';
  }
  if (line.kind === 'FREE') {
    return '1';
  }
  if (line.quantity.milli % 1000 === 0) {
    return String(line.quantity.milli / 1000);
  }
  return String(line.quantity.units);
}
