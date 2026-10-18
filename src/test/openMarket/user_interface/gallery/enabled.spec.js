import {expect} from 'chai';
import {isGalleryEnabled} from '../../../../openMarket/user_interface/gallery/enabled';

describe('Gallery route flag', () => {
  it('stays on in development and when the e2e flag is set', () => {
    expect(isGalleryEnabled({NODE_ENV: 'development'})).to.equal(true);
    expect(isGalleryEnabled({NODE_ENV: 'test'})).to.equal(true);
    expect(isGalleryEnabled({NODE_ENV: 'production', OPENMARKET_GALLERY: '1'})).to.equal(true);
  });

  it('stays off in a production bundle without the flag', () => {
    expect(isGalleryEnabled({NODE_ENV: 'production'})).to.equal(false);
    expect(isGalleryEnabled({NODE_ENV: 'production', OPENMARKET_GALLERY: '0'})).to.equal(false);
  });
});
