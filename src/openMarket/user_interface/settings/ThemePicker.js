import React from 'react';
import Theme from '../../domain/appearance/Theme';
import {picker} from './RadioCards';

const NAMES = {
  mercado: 'Mercado',
  'mostrador-noche': 'Mostrador Noche',
  ultramarinos: 'Ultramarinos',
  'unexpected-neon': 'Unexpected Neon'
};

const THEMES = Theme.ids().map(id => ({id, name: NAMES[id] || id}));

const SWATCHES = ['background', 'surface', 'primary', 'accent', 'text'];

function ThemeSwatches() {
  return (
    <span className="theme-swatches" aria-hidden="true">
      {SWATCHES.map(swatch => (
        <span
          key={swatch}
          className="theme-swatch"
          style={{backgroundColor: 'var(--om-color-' + swatch + ')'}}
        />
      ))}
    </span>
  );
}

const THEME_SPEC = {
  choices: THEMES,
  savedKey: 'theme',
  attribute: 'data-theme',
  cardClass: 'theme-card',
  nameClass: 'theme-card-name',
  groupClass: 'theme-picker',
  label: 'Apariencia',
  detail: ThemeSwatches
};

/**
 * Radio cards for the four themes. Choosing one previews it. The page Guardar persists it.
 * @param {object} props
 */
export default function ThemePicker(props) {
  return picker(props, THEME_SPEC);
}
