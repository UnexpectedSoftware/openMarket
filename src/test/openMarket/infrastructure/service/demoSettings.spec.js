import { expect } from 'chai';
import AppearancePreferences from '../../../../openMarket/domain/appearance/AppearancePreferences';
import LanguagePreferences from '../../../../openMarket/domain/shop/LanguagePreferences';
import PrinterSettings from '../../../../openMarket/domain/shop/PrinterSettings';
import SellPreferences from '../../../../openMarket/domain/shop/SellPreferences';
import { buildSettings } from '../../../../openMarket/infrastructure/dev/demoSettings';

describe('Demo settings', () => {
  const settings = buildSettings();

  it('describes the ticket, the printer, the theme, and the language the domain accepts', () => {
    const ticket = new SellPreferences(settings.sell);
    expect(ticket.printMode).to.equal('ask');
    expect(ticket.paperWidthMm).to.equal(80);
    expect(ticket.headerText).to.equal('Ultramarinos La Plaza');
    expect(ticket.footerText).to.equal('Gracias por su compra. IVA incluido.');

    const printer = new PrinterSettings(settings.printer);
    expect(printer.type).to.equal('epson');
    expect(printer.interface).to.equal('/dev/usb/lp');
    expect(printer.characterSet).to.equal('SPAIN1');

    const appearance = new AppearancePreferences(settings.appearance);
    expect(appearance.theme.id).to.equal('mercado');
    expect(appearance.layout.id).to.equal('mostrador');

    expect(new LanguagePreferences(settings.language).locale).to.equal('es');
  });
});
