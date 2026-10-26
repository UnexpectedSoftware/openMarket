import SellLayout from '../../domain/appearance/SellLayout';
import {picker} from './RadioCards';

const NAMES = {
  mostrador: 'Mostrador',
  escaner: 'Escáner',
  tactil: 'Táctil'
};

const LAYOUTS = SellLayout.ids().map(id => ({id, name: NAMES[id] || id}));

const LAYOUT_SPEC = {
  choices: LAYOUTS,
  savedKey: 'layout',
  attribute: 'data-layout',
  cardClass: 'layout-card',
  nameClass: 'layout-card-name',
  groupClass: 'layout-picker',
  labelledBy: 'sell-layout-label'
};

/**
 * Radio cards for the sell-screen presets. Choosing one previews it.
 * The page Guardar persists it.
 * @param {object} props
 */
export default function LayoutPicker(props) {
  return picker(props, LAYOUT_SPEC);
}
