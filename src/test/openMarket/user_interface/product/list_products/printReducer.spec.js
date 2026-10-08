import {expect} from 'chai';
import reducer from '../../../../../openMarket/user_interface/product/list_products/printReducer';
import {catalogPrintFinished, catalogPrintProgressed} from '../../../../../openMarket/user_interface/product/list_products/action';

describe('catalog print reducer', () => {
  it('stores the percent and clears it when the job ends', () => {
    expect(reducer(undefined, {type: 'OTHER'})).to.equal(null);
    const running = reducer(null, catalogPrintProgressed(42));
    expect(running).to.deep.equal({percent: 42});
    expect(reducer(running, catalogPrintFinished())).to.equal(null);
  });
});
