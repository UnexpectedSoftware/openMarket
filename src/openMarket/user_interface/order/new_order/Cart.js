import React, {Component} from 'react';
import Button from '../../components/Button';
import IconButton from '../../components/IconButton';
import NumberField from '../../components/NumberField';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import Money from '../../../domain/money/Money';
import Quantity from '../../../domain/money/Quantity';
import {formatMoney} from '../../i18n/money';
import PluginSlot from '../../components/PluginSlot';
import {lineAmount, lineIsValid, vatRows} from './model';

/**
 * One ticket line. Quantity stays a NumberField so the existing sale tests can read it.
 */
export default class Cart extends Component {

  constructor(props) {
    super(props);
    this.onCharge = this.onCharge.bind(this);
  }

  onCharge() {
    if (this.props.onCharge) {
      this.props.onCharge();
    }
  }

  render() {
    const props = this.props;
    const lines = (props.order && props.order.lines) || [];
    const readonly = !!props.readonly;
    const lowSet = props.lowStockBarcodes || [];
    const invalid = lines.some(line => !lineIsValid(line));
    const canCharge = !readonly && lines.length > 0 && !invalid;
    const rows = vatRows(lines);
    return (
      <section className="sell-cart" aria-label="Ticket">
        <div className="sell-lines">
          {lines.length === 0 ? (
            <EmptyState icon="shopping-basket" title="El ticket está vacío" />
          ) : lines.map((line, index) => this.renderLine(line, index, readonly, lowSet))}
        </div>
        <footer className="sell-footer">
          <PluginSlot name="sell.cart.footer" />
          <ul className="order-vat">
            {rows.map(row => (
              <li key={row.label}>
                <span>{row.label}</span>
                <span className="sell-money">{formatMoney(Money.ofCents(row.baseCents))}</span>
                <span className="sell-money">{formatMoney(Money.ofCents(row.quotaCents))}</span>
              </li>
            ))}
          </ul>
          <div className="order-total">
            <span className="sell-total">{formatMoney(props.order && props.order.total ? props.order.total : Money.ofCents(0))}</span>
            {readonly ? (
              <Button type="button" variant="secondary" size="lg" icon="print" onClick={props.onPrint}>
                Imprimir
              </Button>
            ) : (
              <Button type="button" size="lg" icon="check" disabled={!canCharge} onClick={this.onCharge}>
                Cobrar (F12)
              </Button>
            )}
          </div>
        </footer>
      </section>
    );
  }

  renderLine(line, index, readonly, lowSet) {
    const valid = lineIsValid(line);
    const selected = this.props.selected === index;
    const low = line.lowStock || lowSet.indexOf(line.barcode) !== -1;
    const weighted = !!line.weighted;
    const free = line.kind === 'FREE';
    const classes = ['sell-line'];
    if (!valid) {
      classes.push('is-invalid');
    }
    if (selected) {
      classes.push('is-selected');
    }
    return (
      <div
        className={classes.join(' ')}
        key={(line.barcode || 'free') + '-' + index}
        aria-invalid={valid ? undefined : 'true'}
        onClick={() => this.props.onSelect && this.props.onSelect(index)}
      >
        <div className="sell-line-name">
          <span>{line.name}</span>
          {low && !free ? <Badge tone="warning">Stock bajo</Badge> : null}
          {valid ? null : <Badge tone="danger">Cantidad no válida</Badge>}
        </div>
        <span className="sell-money sell-line-price">{formatMoney(line.unitPrice)}</span>
        <div className="sell-qty">
          {!readonly && !weighted && !free ? (
            <IconButton icon="minus" label="Menos" onClick={() => this.step(line, -1)} />
          ) : null}
          <NumberField
            id={'sell-qty-' + index}
            name="quantity"
            label="Cantidad"
            decimals={weighted ? 3 : 0}
            unit={weighted ? 'kg' : undefined}
            value={quantityText(line)}
            readOnly={readonly || weighted || free}
            onFocus={weighted && !readonly ? () => this.props.onEditWeighted && this.props.onEditWeighted(line) : undefined}
            onChange={readonly || weighted || free ? undefined : value => this.props.onQuantityChange({
              barcode: line.barcode,
              quantityChanged: value
            })}
          />
          {!readonly && !weighted && !free ? (
            <IconButton icon="plus" label="Más" onClick={() => this.step(line, 1)} />
          ) : null}
        </div>
        <span className="sell-money sell-line-subtotal">{formatMoney(lineAmount(line))}</span>
        {!readonly ? (
          <IconButton
            icon="trash"
            label="Quitar"
            variant="danger"
            onClick={() => this.props.onDelete && this.props.onDelete(line.barcode, index)}
          />
        ) : null}
      </div>
    );
  }

  step(line, delta) {
    const next = line.quantity.plus(Quantity.from(delta));
    const units = next.milli < 0 ? 0 : next.units;
    if (this.props.onQuantityChange) {
      this.props.onQuantityChange({barcode: line.barcode, quantityChanged: units});
    }
    if (this.props.onChanged) {
      this.props.onChanged();
    }
  }

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
