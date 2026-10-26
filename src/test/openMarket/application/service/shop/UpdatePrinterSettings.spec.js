import {expect} from 'chai';
import * as Rx from 'rxjs';
import UpdatePrinterSettings from '../../../../../openMarket/application/service/shop/UpdatePrinterSettings';
import ErrorCode from '../../../../../openMarket/domain/error/ErrorCode';
import PrinterSettings from '../../../../../openMarket/domain/shop/PrinterSettings';

describe('UpdatePrinterSettings', () => {
  it('loads, calls the methods, and saves a new value', done => {
    const original = PrinterSettings.defaults();
    let saved = null;
    const useCase = new UpdatePrinterSettings({
      printerSettingsRepository: {
        findSettings: () => Rx.Observable.of(original),
        save: ({settings}) => {
          saved = settings;
          return Rx.Observable.of(settings);
        }
      }
    });
    useCase.update({
      type: 'star',
      interface: '  tcp://127.0.0.1:9100  ',
      characterSet: 'PC858'
    }).subscribe(settings => {
      expect(settings).to.equal(saved);
      expect(settings).to.not.equal(original);
      expect(settings.type).to.equal('star');
      expect(settings.interface).to.equal('tcp://127.0.0.1:9100');
      expect(settings.characterSet).to.equal('PC858');
      expect(original.type).to.equal('epson');
      expect(original.interface).to.equal('/dev/usb/lp');
      expect(original.characterSet).to.equal('SPAIN1');
      done();
    }, done);
  });

  it('does not save a blank interface', done => {
    let saved = false;
    const useCase = new UpdatePrinterSettings({
      printerSettingsRepository: {
        findSettings: () => Rx.Observable.of(PrinterSettings.defaults()),
        save: () => {
          saved = true;
          return Rx.Observable.of(null);
        }
      }
    });
    useCase.update({type: 'epson', interface: '  ', characterSet: 'SPAIN1'}).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(saved).to.equal(false);
        expect(error.code).to.equal(ErrorCode.PRINTER_SETTINGS_INVALID);
        expect(error.context.field).to.equal('interface');
        done();
      }
    );
  });
});
