import {expect} from 'chai';
import reducer from '../../../../openMarket/user_interface/image/reducer';
import {imageFetchFinished, imageFetchProgressed} from '../../../../openMarket/user_interface/image/action';

describe('image fetch reducer', () => {
  it('stores the percent and clears it when the job ends', () => {
    expect(reducer(undefined, {type: 'OTHER'})).to.equal(null);
    const running = reducer(null, imageFetchProgressed(42));
    expect(running).to.deep.equal({percent: 42});
    expect(reducer(running, imageFetchFinished())).to.equal(null);
  });
});
