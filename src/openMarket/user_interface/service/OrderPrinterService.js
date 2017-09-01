import * as Rx from "rxjs";
import printer from 'node-thermal-printer';

class OrderPrinterService {

  constructor({ printer }){
    printer.init({
      type: 'epson',
      interface: '/dev/usb/lp0',
      characterSet: 'SPAIN1',
      extraSpecialCharacters:{'€':128}
    });
    this._printer = printer;
  }

  /**
   *
   * @param {Order} order
   */
  print({order}){
    this._printer.alignCenter();
    this._printer.setTextDoubleHeight()
    this._printer.setTextDoubleWidth();
    this._printer.println("SUPER COMPRIN");
    this._printer.setTextNormal();
    this._printer.println("NIF 476359906P");
    this._printer.println(`Date ${order.createdAt} `);
    this._printer.drawLine();
    this._printer.alignLeft();
    this._printer.newLine();

    this._printer.tableCustom([
      { text:"Name", align:"LEFT", width:0.40, bold:true },
      { text:"Qty", align:"CENTER", width:0.20, bold:true},
      { text:"Price", align:"CENTER", width:0.20, bold:true },
      { text:"Subt", align:"CENTER", width:0.20, bold:true }
    ]);
    order.lines
      .map(line => ([
        { text:line.name, align:"LEFT", width:0.40},
        { text:line.quantity, align:"CENTER", width:0.20},
        { text:line.price, align:"CENTER", width:0.20},
        { text:line.subtotal, align:"CENTER", width:0.20}
        ]))
      .forEach(printerArray => this._printer.tableCustom(printerArray));

    this._printer.newLine();
    this._printer.alignRight();
    this._printer.print("Total: ");
    this._printer.bold(true);
    this._printer.print(order.total);
    this._printer.print("\u20AC");

    this._printer.cut();
    return this._execute();
  }


  _execute(){
    return Rx.Observable.create(observer => {
      this._printer.execute(function (err) {
        if (err) {
          observer.error("Print failed", err);
        }
      });
      observer.next(true);
      observer.complete();
    });
  }
}

export default new OrderPrinterService({printer: printer});
