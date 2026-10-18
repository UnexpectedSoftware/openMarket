import {expect} from 'chai';
import {isScannerBurst, applyShortcut} from '../../../../../openMarket/user_interface/order/new_order/input';

describe('scanner burst', () => {
  it('needs three keys closer than 30 ms', () => {
    expect(isScannerBurst([0, 10, 20])).to.equal(true);
    expect(isScannerBurst([0, 29, 40])).to.equal(true);
    expect(isScannerBurst([0, 10])).to.equal(false);
    expect(isScannerBurst([0, 10, 40])).to.equal(false);
    expect(isScannerBurst(null)).to.equal(false);
  });
});

describe('sell shortcuts', () => {
  const empty = {searchEmpty: true};
  const typing = {searchEmpty: false};

  it('maps the sell keys and leaves the nav-rail keys alone', () => {
    expect(applyShortcut({key: 'F12'}, empty)).to.equal('charge');
    expect(applyShortcut({key: 'Enter', ctrlKey: true}, empty)).to.equal('charge');
    expect(applyShortcut({key: 'F8'}, empty)).to.equal('free');
    expect(applyShortcut({key: 'F9'}, empty)).to.equal('reprint');
    expect(applyShortcut({key: '+'}, empty)).to.equal('quantity-up');
    expect(applyShortcut({key: '-'}, empty)).to.equal('quantity-down');
    expect(applyShortcut({key: 'ArrowDown'}, empty)).to.equal('select-down');
    expect(applyShortcut({key: 'ArrowUp'}, empty)).to.equal('select-up');
    expect(applyShortcut({key: 'Escape'}, empty)).to.equal('clear-search');
    expect(applyShortcut({key: 'F2'}, empty)).to.equal(null);
    expect(applyShortcut({key: 'F4'}, empty)).to.equal(null);
    expect(applyShortcut({key: 'Enter', altKey: true}, empty)).to.equal(null);
  });

  it('removes a line and opens help only when the search is empty', () => {
    expect(applyShortcut({key: 'Delete'}, empty)).to.equal('remove');
    expect(applyShortcut({key: 'Supr'}, empty)).to.equal('remove');
    expect(applyShortcut({key: 'Delete'}, typing)).to.equal(null);
    expect(applyShortcut({key: '?'}, empty)).to.equal('help');
    expect(applyShortcut({key: '?'}, typing)).to.equal(null);
  });
});
