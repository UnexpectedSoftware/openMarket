import React, {Component} from 'react';
import {Field, reduxForm} from 'redux-form';
import Button from '../../components/Button';
import NumberField, {parseDecimal} from '../../components/NumberField';
import Money from '../../../domain/money/Money';
import Quantity from '../../../domain/money/Quantity';
import {formatMoney} from '../../i18n/money';
import {greaterThan0, number, required} from '../../validations/formValidations';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'];

function WeighField(props) {
  const input = props.input || {};
  const meta = props.meta || {};
  const quantity = parseDecimal(input.value);
  let total = '';
  if (quantity != null && quantity > 0 && props.price) {
    try {
      total = formatMoney(Money.from(props.price).times(Quantity.from(quantity)));
    } catch (error) {
      total = '';
    }
  }
  return (
    <div>
      <NumberField
        id={input.name || 'quantity'}
        name={input.name}
        label="Cantidad"
        unit="kg"
        decimals={3}
        value={input.value}
        onChange={input.onChange}
        onBlur={input.onBlur}
        onFocus={input.onFocus}
        inputRef={props.inputRef}
        error={meta.touched && meta.error ? meta.error : null}
        autoFocus
      />
      <p className="sell-weigh-total">{total ? 'Total ' + total : ''}</p>
    </div>
  );
}

class ReduxForm extends Component {

  constructor(props, context) {
    super(props, context);
    this.save = this.save.bind(this);
    this.setNode = this.setNode.bind(this);
    this.node = null;
  }

  setNode(node) {
    this.node = node;
    if (this.props.quantityRef) {
      this.props.quantityRef(node);
    }
  }

  save(event) {
    event.preventDefault();
    this.props.handleSubmit(event);
  }

  press(symbol) {
    const current = this.node && this.node.value ? String(this.node.value) : '';
    let next = current;
    if (symbol === '⌫') {
      next = current.slice(0, -1);
    } else if (symbol === ',') {
      if (current.indexOf(',') === -1 && current.indexOf('.') === -1) {
        next = (current || '0') + ',';
      }
    } else {
      next = current + symbol;
    }
    const parsed = parseDecimal(next);
    const value = /[.,]$/.test(next) || parsed == null ? next : parsed;
    this.props.change('quantity', value);
  }

  render() {
    const keys = KEYS.map(symbol => (
      <Button
        key={symbol}
        type="button"
        variant="secondary"
        className="sell-key"
        onClick={() => this.press(symbol)}
      >
        {symbol}
      </Button>
    ));
    return (
      <form onSubmit={this.save}>
        <Field
          name="quantity"
          component={WeighField}
          price={this.props.price}
          inputRef={this.setNode}
          validate={[required, greaterThan0, number]}
        />
        <div className="sell-keys">{keys}</div>
        <Button type="submit" disabled={this.props.invalid}>Añadir</Button>
      </form>
    );
  }
}

export default reduxForm({
  form: 'weighted_dialog'
})(ReduxForm);
