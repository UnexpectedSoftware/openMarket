import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import {
  forgetFetched,
  rememberFetched,
  unlinkFetchedTemp
} from '../../../../../openMarket/user_interface/product/list_products/lookupTemp';

function tempFile(name) {
  const file = path.join(os.tmpdir(), name);
  fs.writeFileSync(file, 'photo');
  return file;
}

describe('lookup temp files', () => {
  const names = [];

  afterEach(() => {
    forgetFetched();
    names.forEach(name => {
      const file = path.join(os.tmpdir(), name);
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
    names.length = 0;
  });

  it('deletes only an openfoodfacts file in the temp directory', () => {
    expect(() => unlinkFetchedTemp(null)).to.not.throw();
    expect(() => unlinkFetchedTemp(12)).to.not.throw();
    expect(() => unlinkFetchedTemp('')).to.not.throw();
    const kept = tempFile('catalog-photo.jpg');
    names.push('catalog-photo.jpg');
    unlinkFetchedTemp(kept);
    expect(fs.existsSync(kept)).to.equal(true);
    unlinkFetchedTemp(path.join(path.dirname(os.tmpdir()), 'openfoodfacts-outside.jpg'));
    const missing = path.join(os.tmpdir(), 'openfoodfacts-missing.jpg');
    expect(() => unlinkFetchedTemp(missing)).to.not.throw();
    const fetched = tempFile('openfoodfacts-milk.jpg');
    names.push('openfoodfacts-milk.jpg');
    unlinkFetchedTemp(fetched);
    expect(fs.existsSync(fetched)).to.equal(false);
  });

  it('replaces the remembered file and forgets it when the drawer closes', () => {
    const first = tempFile('openfoodfacts-first.jpg');
    const second = tempFile('openfoodfacts-second.jpg');
    names.push('openfoodfacts-first.jpg', 'openfoodfacts-second.jpg');
    rememberFetched(first);
    rememberFetched(first);
    expect(fs.existsSync(first)).to.equal(true);
    rememberFetched(second);
    expect(fs.existsSync(first)).to.equal(false);
    expect(fs.existsSync(second)).to.equal(true);
    forgetFetched();
    expect(fs.existsSync(second)).to.equal(false);
    expect(() => forgetFetched()).to.not.throw();
    rememberFetched(null);
  });
});