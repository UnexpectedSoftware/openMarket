/**
 * The development menu. Production builds pass `development: false` and get no items.
 * @param {{development: boolean, onReset: () => void}} menu
 * @returns {object[]}
 */
export function demoDataMenu({development, onReset}) {
  if (development !== true) {
    return [];
  }
  return [{
    label: 'Desarrollo',
    submenu: [{
      label: 'Reiniciar datos de demo',
      click() {
        onReset();
      }
    }]
  }];
}
