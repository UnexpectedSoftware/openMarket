import React, {Component} from 'react';
import TextField from './TextField';

/**
 * @typedef {Object} NumberFieldProps
 * @property {string} id
 * @property {string} label
 * @property {string} [name]
 * @property {number|string} [value]
 * @property {Function} [onChange] Called with a number, or '' when the field is cleared.
 * @property {Function} [onBlur]
 * @property {Function} [onFocus]
 * @property {string} [error]
 * @property {string} [hint]
 * @property {boolean} [required]
 * @property {boolean} [autoFocus]
 * @property {Function} [inputRef]
 * @property {boolean} [readOnly]
 * @property {string} [placeholder]
 * @property {number|string} [step]
 * @property {number|string} [min]
 * @property {number|string} [max]
 * @property {number} [decimals]
 * @property {string} [unit] Shown after the input, for example `kg` or `€`.
 */

/**
 * Accepts `,` and `.` while typing and emits a finite number.
 * @param {string|number|null|undefined} raw
 * @returns {number|null}
 */
export function parseDecimal(raw) {
  if (raw == null) {
    return null;
  }
  const text = String(raw).trim().replace(',', '.');
  if (text === '' || text === '.' || text === '-' || text === '-.') {
    return null;
  }
  const value = Number(text);
  return isFinite(value) ? value : null;
}

/**
 * @param {number} value
 * @param {number|undefined} decimals
 * @returns {number}
 */
function roundTo(value, decimals) {
  if (decimals == null) {
    return value;
  }
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * @param {number|string|null|undefined} value
 * @returns {string}
 */
function format(value) {
  if (value == null || value === '') {
    return '';
  }
  return String(value);
}

/**
 * @param {string} raw
 * @returns {boolean}
 */
function isTyping(raw) {
  return /^-?\d*[.,]?\d*$/.test(raw);
}

/**
 * Decimal input. Keeps the typed text (including a trailing comma) while the
 * parent stores the parsed number.
 */
export default class NumberField extends Component {

  /**
   * @param {NumberFieldProps} props
   */
  constructor(props) {
    super(props);
    this.state = {draft: format(props.value)};
    this.onChange = this.onChange.bind(this);
    this.onBlur = this.onBlur.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value === this.props.value) {
      return;
    }
    const parsed = parseDecimal(this.state.draft);
    const nextBlank = nextProps.value == null || nextProps.value === '';
    if (nextBlank && this.state.draft !== '' && parsed == null) {
      return;
    }
    if (parsed !== nextProps.value && format(nextProps.value) !== this.state.draft) {
      this.setState({draft: format(nextProps.value)});
    }
  }

  onChange(event) {
    const raw = event.target.value;
    if (raw !== '' && !isTyping(raw)) {
      this.setState({draft: this.state.draft});
      return;
    }
    this.setState({draft: raw});
    if (raw === '' || raw === '.' || raw === ',' || raw === '-' || raw === '-.') {
      this.props.onChange('');
      return;
    }
    const parsed = parseDecimal(raw);
    if (parsed == null) {
      return;
    }
    this.props.onChange(roundTo(parsed, this.props.decimals));
  }

  onBlur(event) {
    const parsed = parseDecimal(this.state.draft);
    if (this.state.draft !== '' && parsed == null) {
      this.setState({draft: format(this.props.value)});
    }
    if (this.props.onBlur) {
      this.props.onBlur(event);
    }
  }

  render() {
    const props = this.props;
    return (
      <TextField
        id={props.id}
        name={props.name}
        label={props.label}
        value={this.state.draft}
        onChange={this.onChange}
        onBlur={this.onBlur}
        onFocus={props.onFocus}
        error={props.error}
        hint={props.hint}
        required={props.required}
        autoFocus={props.autoFocus}
        inputRef={props.inputRef}
        readOnly={props.readOnly}
        placeholder={props.placeholder}
        inputMode="decimal"
        suffix={props.unit}
        min={props.min}
        max={props.max}
        step={props.step}
      />
    );
  }
}
