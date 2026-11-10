import { expect } from 'chai';
import AppearancePreferences from '../../../../openMarket/domain/appearance/AppearancePreferences';
import LanguagePreferences from '../../../../openMarket/domain/shop/LanguagePreferences';
import PrinterSettings from '../../../../openMarket/domain/shop/PrinterSettings';
import SellPreferences from '../../../../openMarket/domain/shop/SellPreferences';
import { buildSettings } from '../../../../openMarket/infrastructure/dev/demoSettings';

describe('Demo settings', () => {
  const settings = buildSettings();

  it('stores the ticket, the printer, the theme, and the language', () => {
    const sell = value('sell_auto_print');
    const ticket = new SellPreferences(sell);
    expect(ticket.printMode).to.equal('ask');
    expect(ticket.templateId).to.equal('classic-80');
    expect(ticket.paperWidthMm).to.equal(80);
    expect(ticket.headerText).to.equal('Ultramarinos La Plaza');
    expect(ticket.footerText).to.equal('Gracias por su compra. IVA incluido.');

    const printer = new PrinterSettings(value('printer'));
    expect(printer.type).to.equal('epson');
    expect(printer.interface).to.equal('/dev/usb/lp');
    expect(printer.characterSet).to.equal('SPAIN1');

    const appearance = new AppearancePreferences(value('appearance'));
    expect(appearance.theme.id).to.equal('mercado');
    expect(appearance.layout.id).to.equal('mostrador');

    const language = new LanguagePreferences(value('language'));
    expect(language.locale).to.equal('es');
  });

  function value(key) {
    return settings.find(setting => setting.key === key).value;
  }
});
