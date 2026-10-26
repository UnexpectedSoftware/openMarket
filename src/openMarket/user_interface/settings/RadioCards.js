import React, {Component} from 'react';
import {applyRadioKey} from './radioChoice';

/**
 * One radio-card group. Theme and layout pickers share it.
 */
export default class RadioCards extends Component {

  constructor(props) {
    super(props);
    this._cards = {};
    this._focusId = null;
    this._select = this._select.bind(this);
    this._key = this._key.bind(this);
  }

  componentWillUnmount() {
    if (this.props.applied !== this.props.saved && this.props.onDiscard) {
      this.props.onDiscard(this.props.saved);
    }
  }

  componentDidUpdate() {
    if (this._focusId && this._cards[this._focusId]) {
      this._cards[this._focusId].focus();
      this._focusId = null;
    }
  }

  _select(id) {
    if (this.props.onPreview) {
      this.props.onPreview(id);
    }
  }

  _key(event) {
    const choices = this.props.choices || [];
    applyRadioKey(event, {
      ids: choices.map(choice => choice.id),
      applied: this.props.applied,
      attribute: this.props.attribute,
      select: this._select,
      focus: id => {
        this._focusId = id;
      }
    });
  }

  render() {
    const props = this.props;
    const applied = props.applied;
    const cards = (props.choices || []).map(choice => this.renderCard(choice, choice.id === applied));
    return (
      <div
        className={props.groupClass}
        role="radiogroup"
        aria-label={props.label}
        aria-labelledby={props.labelledBy}
      >
        {cards}
      </div>
    );
  }

  renderCard(choice, selected) {
    const props = this.props;
    const data = {};
    data[props.attribute] = choice.id;
    return (
      <div
        key={choice.id}
        role="radio"
        aria-checked={selected}
        tabIndex={selected ? 0 : -1}
        {...data}
        className={selected ? props.cardClass + ' is-selected' : props.cardClass}
        onClick={() => this._select(choice.id)}
        onKeyDown={this._key}
        ref={node => {
          this._cards[choice.id] = node;
        }}
      >
        <span className={props.nameClass}>{choice.name}</span>
        {props.detail ? React.createElement(props.detail) : null}
      </div>
    );
  }

}

/**
 * @param {object} props
 * @param {object} spec
 */
export function picker(props, spec) {
  return (
    <RadioCards
      choices={spec.choices}
      applied={props.applied}
      saved={props[spec.savedKey]}
      attribute={spec.attribute}
      cardClass={spec.cardClass}
      nameClass={spec.nameClass}
      groupClass={spec.groupClass}
      label={spec.label}
      labelledBy={spec.labelledBy}
      detail={spec.detail}
      onPreview={props.onPreview}
      onDiscard={props.onDiscard}
    />
  );
}
