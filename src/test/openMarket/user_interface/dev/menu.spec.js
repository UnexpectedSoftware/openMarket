import { expect } from 'chai';
import { demoDataMenu } from '../../../../openMarket/user_interface/dev/menu';

describe('Demo data menu', () => {
  it('is present only in development and runs the reset', () => {
    expect(demoDataMenu({development: false, onReset() {}})).to.deep.equal([]);
    let called = false;
    const menu = demoDataMenu({
      development: true,
      onReset() {
        called = true;
      }
    });
    expect(menu).to.have.length(1);
    expect(menu[0].label).to.equal('Desarrollo');
    expect(menu[0].submenu[0].label).to.equal('Reiniciar datos de demo');
    menu[0].submenu[0].click();
    expect(called).to.equal(true);
  });
});
