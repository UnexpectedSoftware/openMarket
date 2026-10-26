import {expect} from 'chai';
import {shopInitials, shopMark, shopName} from '../../../../openMarket/user_interface/containers/shopMark';

describe('shop initials', () => {
  it('takes the trade name, then the legal name', () => {
    expect(shopName({tradeName: ' Ultramarinos Pérez ', legalName: 'Legal SL'})).to.equal('Ultramarinos Pérez');
    expect(shopName({tradeName: '   ', legalName: '  Pérez SL  '})).to.equal('Pérez SL');
    expect(shopName({tradeName: '', legalName: ''})).to.equal('');
    expect(shopName(null)).to.equal('');
    expect(shopName({})).to.equal('');
  });

  it('builds at most two initials and falls back when there are no letters', () => {
    expect(shopInitials('Open Market')).to.equal('OM');
    expect(shopInitials('Ultramarinos Pérez')).to.equal('UP');
    expect(shopInitials('El Corte Inglés')).to.equal('EC');
    expect(shopInitials('  tienda   uno  ')).to.equal('TU');
    expect(shopInitials('café-bar')).to.equal('CB');
    expect(shopInitials('Ángel')).to.equal('ÁN');
    expect(shopInitials('ñandú')).to.equal('ÑA');
    expect(shopInitials('Pérez')).to.equal('PÉ');
    expect(shopInitials('A')).to.equal('A');
    expect(shopInitials('A Mercado')).to.equal('AM');
    expect(shopInitials('OpenMarket')).to.equal('OP');
    expect(shopInitials('')).to.equal('OM');
    expect(shopInitials('   ')).to.equal('OM');
    expect(shopInitials('---')).to.equal('OM');
    expect(shopInitials('123')).to.equal('OM');
    expect(shopInitials(null)).to.equal('OM');
    expect(shopInitials(undefined)).to.equal('OM');
  });

  it('labels a shop with no name as OpenMarket', () => {
    expect(shopMark({tradeName: 'Ultramarinos Pérez', legalName: 'SL'})).to.deep.equal({
      name: 'Ultramarinos Pérez',
      initials: 'UP'
    });
    expect(shopMark({legalName: 'Pérez'})).to.deep.equal({name: 'Pérez', initials: 'PÉ'});
    expect(shopMark(null)).to.deep.equal({name: 'OpenMarket', initials: 'OM'});
    expect(shopMark({tradeName: '  ', legalName: '  '})).to.deep.equal({
      name: 'OpenMarket',
      initials: 'OM'
    });
  });
});
