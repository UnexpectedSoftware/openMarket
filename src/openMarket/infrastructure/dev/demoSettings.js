/**
 * @typedef {object} DemoSettings
 * @property {{printMode: string, headerText: string, footerText: string, paperWidthMm: number}} sell
 * @property {{type: string, interface: string, characterSet: string}} printer
 * @property {{theme: string, layout: string}} appearance
 * @property {{locale: string}} language
 */

/**
 * Ticket, printer, theme, layout, and language for the demo shop,
 * shaped as the Ajustes use cases take them.
 * @returns {DemoSettings}
 */
export function buildSettings() {
  return {
    sell: {
      printMode: 'ask',
      headerText: 'Ultramarinos La Plaza',
      footerText: 'Gracias por su compra. IVA incluido.',
      paperWidthMm: 80
    },
    printer: {
      type: 'epson',
      interface: '/dev/usb/lp',
      characterSet: 'SPAIN1'
    },
    appearance: {
      theme: 'mercado',
      layout: 'mostrador'
    },
    language: {locale: 'es'}
  };
}
