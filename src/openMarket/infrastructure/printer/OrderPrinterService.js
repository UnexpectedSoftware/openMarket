const MAX_CHARACTERS = 19;

export default class OrderPrinterService {

  constructor({ printerConnection }){
    this._connection = printerConnection;
  }

  /**
   *
   * @param {Order} order
   * @returns {Observable<boolean>}
   */
  print({order}){
    return this._connection.print((printer) => {
      printer.alignCenter();
      printer.setTextDoubleHeight();
      printer.setTextDoubleWidth();
      printer.println('SUPER COMPRIN');
      printer.setTextNormal();
      printer.println('NIF 476359906P');
      printer.println(`Date ${order.createdAt} `);
      printer.drawLine();
      printer.alignLeft();
      printer.newLine();

      printer.tableCustom([
        { text: 'Name', align: 'LEFT', width: 0.40, bold: true },
        { text: 'Qty', align: 'CENTER', width: 0.20, bold: true },
        { text: 'Price', align: 'CENTER', width: 0.20, bold: true },
        { text: 'Subt', align: 'CENTER', width: 0.20, bold: true }
      ]);
      order.lines
        .map(line => ([
          { text: line.name.slice(0, MAX_CHARACTERS), align: 'LEFT', width: 0.40 },
          { text: line.quantity, align: 'CENTER', width: 0.20 },
          { text: line.price, align: 'CENTER', width: 0.20 },
          { text: line.subtotal, align: 'CENTER', width: 0.20 }
        ]))
        .forEach(row => printer.tableCustom(row));

      printer.newLine();
      printer.alignRight();
      printer.print('Total: ');
      printer.bold(true);
      printer.print(order.total);
      printer.print('€');
      printer.newLine();
      printer.println('IVA incluido');
      printer.cut();
    });
  }

}
