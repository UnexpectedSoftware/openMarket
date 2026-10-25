import {expect} from 'chai';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';
import InvalidSellPreferencesError from '../../../../openMarket/domain/shop/InvalidSellPreferencesError';
import SellPreferences from '../../../../openMarket/domain/shop/SellPreferences';

describe('SellPreferences', () => {
  it('asks on 80 mm paper with blank copy', () => {
    const preferences = SellPreferences.defaults();
    expect(preferences.printMode).to.equal('ask');
    expect(preferences.headerText).to.equal('');
    expect(preferences.footerText).to.equal('');
    expect(preferences.paperWidthMm).to.equal(80);
    expect(preferences.autoPrint).to.equal(undefined);
    expect(preferences.withAutoPrint).to.equal(undefined);
    expect(new SellPreferences({}).paperWidthMm).to.equal(80);
    expect(new SellPreferences({headerText: null, footerText: undefined}).headerText).to.equal('');
    expect(new SellPreferences({headerText: null, footerText: undefined}).footerText).to.equal('');
  });

  it('keeps never, trims copy, and keeps 58 mm on a new value', () => {
    const original = new SellPreferences({
      printMode: 'always',
      headerText: '  Hola  ',
      footerText: '  Pie  ',
      paperWidthMm: 80
    });
    const mode = original.withPrintMode('never');
    expect(mode).to.not.equal(original);
    expect(mode.printMode).to.equal('never');
    expect(mode.headerText).to.equal('Hola');
    expect(mode.footerText).to.equal('Pie');
    expect(mode.paperWidthMm).to.equal(80);
    expect(original.printMode).to.equal('always');

    const copy = mode.withCopy({headerText: ' Gracias ', footerText: '  '});
    expect(copy.printMode).to.equal('never');
    expect(copy.headerText).to.equal('Gracias');
    expect(copy.footerText).to.equal('');
    expect(copy.paperWidthMm).to.equal(80);
    expect(mode.headerText).to.equal('Hola');

    const width = copy.withPaperWidth(58);
    expect(width.printMode).to.equal('never');
    expect(width.headerText).to.equal('Gracias');
    expect(width.footerText).to.equal('');
    expect(width.paperWidthMm).to.equal(58);
    expect(copy.paperWidthMm).to.equal(80);

    const ask = new SellPreferences({printMode: 'ask', paperWidthMm: 58});
    expect(ask.printMode).to.equal('ask');
    expect(ask.paperWidthMm).to.equal(58);
    expect(ask.withPrintMode('always').printMode).to.equal('always');
    expect(ask.withPaperWidth(80).paperWidthMm).to.equal(80);
  });

  it('accepts 80 characters and rejects a longer header or footer', () => {
    const eighty = 'a'.repeat(80);
    const padded = ' ' + eighty + ' ';
    expect(new SellPreferences({headerText: eighty, footerText: padded}).headerText).to.equal(eighty);
    expect(new SellPreferences({headerText: eighty, footerText: padded}).footerText).to.equal(eighty);
    const kept = new SellPreferences({printMode: 'never', paperWidthMm: 58});
    expect(() => kept.withCopy({headerText: 'a'.repeat(81), footerText: 'ok'}))
      .to.throw(InvalidSellPreferencesError)
      .with.property('code', ErrorCode.SELL_PREFERENCES_INVALID);
    try {
      kept.withCopy({headerText: 'ok', footerText: 'b'.repeat(81)});
      expect.fail('footer should throw');
    } catch (error) {
      expect(error).to.be.instanceof(InvalidSellPreferencesError);
      expect(error.context.field).to.equal('footerText');
    }
    try {
      new SellPreferences({headerText: 'c'.repeat(81)});
      expect.fail('header should throw');
    } catch (error) {
      expect(error.context.field).to.equal('headerText');
    }
    expect(kept.printMode).to.equal('never');
    expect(kept.headerText).to.equal('');
    expect(kept.paperWidthMm).to.equal(58);
  });

  it('rejects an unknown mode and an unknown width', () => {
    const preferences = SellPreferences.defaults();
    expect(() => preferences.withPrintMode('later'))
      .to.throw(InvalidSellPreferencesError)
      .that.satisfies(error => error.context.field === 'printMode' && error.context.value === 'later');
    expect(() => new SellPreferences({printMode: 'soon'})).to.throw(InvalidSellPreferencesError);
    expect(() => preferences.withPaperWidth(72))
      .to.throw(InvalidSellPreferencesError)
      .that.satisfies(error => error.context.field === 'paperWidthMm' && error.context.value === 72);
    expect(() => new SellPreferences({paperWidthMm: 72})).to.throw(InvalidSellPreferencesError);
    expect(preferences.printMode).to.equal('ask');
    expect(preferences.paperWidthMm).to.equal(80);
  });
});
