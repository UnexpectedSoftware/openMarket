/**
 * Ticket, printer, theme, layout, and language rows for the demo shop.
 * Keys match the settings repositories.
 * @returns {Array<{key: string, value: object}>}
 */
export function buildSettings() {
  return [
    {
      key: 'sell_auto_print',
      value: {
        printMode: 'ask',
        headerText: 'Ultramarinos La Plaza',
        footerText: 'Gracias por su compra. IVA incluido.',
        paperWidthMm: 80,
        templateId: 'classic-80'
      }
    },
    {
      key: 'printer',
      value: {
        type: 'epson',
        interface: '/dev/usb/lp',
        characterSet: 'SPAIN1'
      }
    },
    {
      key: 'appearance',
      value: {
        theme: 'mercado',
        layout: 'mostrador'
      }
    },
    {
      key: 'language',
      value: {locale: 'es'}
    }
  ];
}
