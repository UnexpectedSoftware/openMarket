import OrderPrinterService from "./OrderPrinterService";

export default class OrderPrinterFactory {
  constructor({printerConnection}) {
    this._printerConnection = printerConnection;
  }

  makePrinterService(){
    return new OrderPrinterService({printerConnection: this._printerConnection});
  }

}
