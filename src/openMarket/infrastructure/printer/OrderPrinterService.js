import * as Rx from "rxjs";

const MAX_CHARACTERS = 19;

export default class OrderPrinterService {

  constructor({ printerConnection }){
    this._printer = printerConnection.printer;
  }

  /**
   *
   * @param {Order} order
   */
  print({order}){
    this._printer.alignCenter();
    this._printer.setTextDoubleHeight()
    this._printer.setTextDoubleWidth();
    this._printer.println('SUPER COMPRIN');
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
        { text:line.name.slice(0, this.MAX_CHARACTERS), align:"LEFT", width:0.40},
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
    this._printer.print('€');
    this._printer.newLine();
    this._printer.println("IVA incluido");
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

  get MAX_CHARACTERS (){
    return MAX_CHARACTERS;
  }

}
