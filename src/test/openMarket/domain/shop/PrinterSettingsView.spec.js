import {expect} from 'chai';
import PrinterSettings from '../../../../openMarket/domain/shop/PrinterSettings';
import PrinterSettingsQuery from '../../../../openMarket/domain/shop/PrinterSettingsQuery';
import PrinterSettingsView from '../../../../openMarket/domain/shop/PrinterSettingsView';

describe('PrinterSettingsQuery', () => {
  it('constructs and freezes an empty criteria value', () => {
    const query = new PrinterSettingsQuery();
    expect(Object.isFrozen(query)).to.equal(true);
    expect(Object.keys(query)).to.deep.equal([]);
    expect(() => {
      query.type = 'star';
    }).to.throw(TypeError);
  });
});

describe('PrinterSettingsView', () => {
  it('freezes the default and does not build the aggregate', () => {
    const view = new PrinterSettingsView();
    expect(view).to.not.be.instanceof(PrinterSettings);
    expect(view.withType).to.equal(undefined);
    expect(view.withInterface).to.equal(undefined);
    expect(Object.isFrozen(view)).to.equal(true);
    expect(() => {
      view.type = 'star';
    }).to.throw(TypeError);
    expect(view.type).to.equal('epson');
    expect(view.interface).to.equal('/dev/usb/lp');
    expect(view.characterSet).to.equal('SPAIN1');
  });

  it('stores the given fields and does not check them', () => {
    const path = 't'.repeat(201);
    const view = new PrinterSettingsView({
      type: 'tanca',
      interface: path,
      characterSet: 'UTF-8'
    });
    expect(view.type).to.equal('tanca');
    expect(view.interface).to.equal(path);
    expect(view.characterSet).to.equal('UTF-8');
    expect(new PrinterSettingsView({type: 'star', characterSet: 'PC850'}).type).to.equal('star');
    expect(new PrinterSettingsView({type: 'star', characterSet: 'PC850'}).characterSet).to.equal('PC850');
    expect(new PrinterSettingsView({interface: ''}).interface).to.equal('');
  });
});
