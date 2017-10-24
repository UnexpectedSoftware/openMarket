import printer from 'node-thermal-printer';

export default class PrinterConnection {
  constructor() {
    printer.init({
      type: 'epson',
      interface: '/dev/usb/lp',
      characterSet: 'SPAIN1',
      extraSpecialCharacters:{'€':128}
    });
    this._printer = printer;
  }


  get printer() {
    return this._printer;
  }
}
