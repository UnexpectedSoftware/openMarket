import {expect} from 'chai';
import {statusLabel, statusTone} from '../../../../../openMarket/user_interface/product/list_products/statusLabel';

describe('statusLabel', () => {
  it('names the two catalog statuses', () => {
    expect(statusLabel('ENABLED')).to.equal('Activo');
    expect(statusLabel('DISABLED')).to.equal('Inactivo');
    expect(statusLabel('OTHER')).to.equal('');
    expect(statusTone('ENABLED')).to.equal('success');
    expect(statusTone('DISABLED')).to.equal('neutral');
  });
});
