import {expect} from 'chai';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';
import InvalidPrinterSettingsError from '../../../../openMarket/domain/shop/InvalidPrinterSettingsError';
import PrinterSettings from '../../../../openMarket/domain/shop/PrinterSettings';

const SETS = ['SPAIN1', 'PC858', 'PC850', 'WPC1252'];

describe('PrinterSettings', () => {
  it('defaults to epson, /dev/usb/lp, and SPAIN1', () => {
    const settings = PrinterSettings.defaults();
    expect(settings.type).to.equal('epson');
    expect(settings.interface).to.equal('/dev/usb/lp');
    expect(settings.characterSet).to.equal('SPAIN1');
    expect(new PrinterSettings({}).type).to.equal('epson');
    expect(new PrinterSettings({}).interface).to.equal('/dev/usb/lp');
    expect(new PrinterSettings({}).characterSet).to.equal('SPAIN1');
    expect(new PrinterSettings({type: undefined, characterSet: undefined}).type).to.equal('epson');
    expect(new PrinterSettings({interface: undefined}).interface).to.equal('/dev/usb/lp');
  });

  it('keeps epson and star, and rejects tanca', () => {
    const epson = new PrinterSettings({type: 'epson', interface: '/dev/usb/lp0', characterSet: 'PC858'});
    expect(epson.type).to.equal('epson');
    const star = epson.withType('star');
    expect(star).to.not.equal(epson);
    expect(star.type).to.equal('star');
    expect(star.interface).to.equal('/dev/usb/lp0');
    expect(star.characterSet).to.equal('PC858');
    expect(epson.type).to.equal('epson');
    expect(new PrinterSettings({type: 'star'}).type).to.equal('star');
    try {
      epson.withType('tanca');
      expect.fail('tanca should throw');
    } catch (error) {
      expect(error).to.be.instanceof(InvalidPrinterSettingsError);
      expect(error.code).to.equal(ErrorCode.PRINTER_SETTINGS_INVALID);
      expect(error.context.field).to.equal('type');
      expect(error.context.value).to.equal('tanca');
    }
    expect(epson.type).to.equal('epson');
    expect(() => new PrinterSettings({type: 'tanca'})).to.throw(InvalidPrinterSettingsError);
  });

  it('trims the interface and rejects a blank one', () => {
    const original = new PrinterSettings({type: 'star', characterSet: 'PC850'});
    const trimmed = original.withInterface('  tcp://127.0.0.1:9100  ');
    expect(trimmed.interface).to.equal('tcp://127.0.0.1:9100');
    expect(trimmed.type).to.equal('star');
    expect(trimmed.characterSet).to.equal('PC850');
    expect(original.interface).to.equal('/dev/usb/lp');
    expect(new PrinterSettings({interface: '  /dev/usb/lp1  '}).interface).to.equal('/dev/usb/lp1');
    try {
      original.withInterface('   ');
      expect.fail('blank should throw');
    } catch (error) {
      expect(error).to.be.instanceof(InvalidPrinterSettingsError);
      expect(error.code).to.equal(ErrorCode.PRINTER_SETTINGS_INVALID);
      expect(error.context.field).to.equal('interface');
      expect(error.context.value).to.equal('');
    }
    expect(original.interface).to.equal('/dev/usb/lp');
    expect(() => new PrinterSettings({interface: ''})).to.throw(InvalidPrinterSettingsError);
    expect(() => new PrinterSettings({interface: null})).to.throw(InvalidPrinterSettingsError)
      .with.property('code', ErrorCode.PRINTER_SETTINGS_INVALID);
    expect(() => original.withInterface(null)).to.throw(InvalidPrinterSettingsError);
  });

  it('accepts 200 characters and rejects a longer interface', () => {
    const twoHundred = 'a'.repeat(200);
    const kept = new PrinterSettings({interface: twoHundred, type: 'epson', characterSet: 'SPAIN1'});
    expect(kept.interface).to.equal(twoHundred);
    expect(kept.withInterface(' ' + twoHundred + ' ').interface).to.equal(twoHundred);
    try {
      kept.withInterface('b'.repeat(201));
      expect.fail('201 should throw');
    } catch (error) {
      expect(error.context.field).to.equal('interface');
      expect(error.context.value).to.equal('b'.repeat(201));
    }
    expect(kept.interface).to.equal(twoHundred);
    expect(() => new PrinterSettings({interface: 'c'.repeat(201)})).to.throw(InvalidPrinterSettingsError);
  });

  it('keeps each character set and rejects UTF-8', () => {
    const original = new PrinterSettings({type: 'star', interface: '/dev/usb/lp2'});
    SETS.forEach(characterSet => {
      const next = original.withCharacterSet(characterSet);
      expect(next.characterSet).to.equal(characterSet);
      expect(next.type).to.equal('star');
      expect(next.interface).to.equal('/dev/usb/lp2');
      expect(new PrinterSettings({characterSet}).characterSet).to.equal(characterSet);
    });
    expect(original.characterSet).to.equal('SPAIN1');
    try {
      original.withCharacterSet('UTF-8');
      expect.fail('UTF-8 should throw');
    } catch (error) {
      expect(error).to.be.instanceof(InvalidPrinterSettingsError);
      expect(error.code).to.equal(ErrorCode.PRINTER_SETTINGS_INVALID);
      expect(error.context.field).to.equal('characterSet');
      expect(error.context.value).to.equal('UTF-8');
    }
    expect(original.characterSet).to.equal('SPAIN1');
    expect(() => new PrinterSettings({characterSet: 'UTF-8'})).to.throw(InvalidPrinterSettingsError);
  });
});
