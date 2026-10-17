import React, {Component} from 'react';
import Theme from '../../domain/appearance/Theme';

const NAMES = {
  mercado: 'Mercado',
  'mostrador-noche': 'Mostrador Noche',
  ultramarinos: 'Ultramarinos',
  'unexpected-neon': 'Unexpected Neon'
};

const THEMES = Theme.ids().map(id => ({id, name: NAMES[id] || id}));

const SWATCHES = ['background', 'surface', 'primary', 'accent', 'text'];

/**
 * Radio cards for the four themes. Choosing one previews it; Guardar persists it.
 */
export default class ThemePicker extends Component {

  constructor(props) {
    super(props);
    this._cards = {};
    this._focusId = null;
    this._select = this._select.bind(this);
    this._key = this._key.bind(this);
    this._save = this._save.bind(this);
  }

  componentWillUnmount() {
    if (this.props.applied !== this.props.theme && this.props.onDiscard) {
      this.props.onDiscard(this.props.theme);
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
    const id = event.currentTarget.getAttribute('data-theme');
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this._select(id);
      return;
    }
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const back = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
    if (!forward && !back) {
      return;
    }
    event.preventDefault();
    const index = THEMES.findIndex(theme => theme.id === this.props.applied);
    const delta = forward ? 1 : -1;
    const next = THEMES[(index + delta + THEMES.length) % THEMES.length];
    this._focusId = next.id;
    this._select(next.id);
  }

  _save() {
    if (this.props.onSave) {
      this.props.onSave(this.props.applied);
    }
  }

  render() {
    const applied = this.props.applied;
    const cards = THEMES.map(theme => {
      const selected = theme.id === applied;
      return (
        <div
          key={theme.id}
          role="radio"
          aria-checked={selected}
          tabIndex={selected ? 0 : -1}
          data-theme={theme.id}
          className={selected ? 'theme-card is-selected' : 'theme-card'}
          onClick={() => this._select(theme.id)}
          onKeyDown={this._key}
          ref={node => {
            this._cards[theme.id] = node;
          }}
        >
          <span className="theme-card-name">{theme.name}</span>
          <span className="theme-swatches" aria-hidden="true">
            {SWATCHES.map(swatch => (
              <span
                key={swatch}
                className="theme-swatch"
                style={{backgroundColor: 'var(--om-color-' + swatch + ')'}}
              />
            ))}
          </span>
        </div>
      );
    });
    return (
      <section className="settings-appearance">
        <h3 id="appearance-heading">Apariencia</h3>
        <div className="theme-picker" role="radiogroup" aria-labelledby="appearance-heading">
          {cards}
        </div>
        <button type="button" className="button theme-save" onClick={this._save}>
          Guardar
        </button>
      </section>
    );
  }

}
