import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { expect } from 'chai';
import { readAppVersion } from '../../../../openMarket/infrastructure/service/AppVersion';

describe('App version', () => {
  const projectDir = path.resolve(__dirname, '../../../../../');

  it('appends the current commit to a checkout version', () => {
    const sha = execFileSync('git', ['-C', projectDir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim().slice(0, 7);
    const version = readAppVersion(path.join(projectDir, 'src'));

    expect(version).to.equal(`0.0.1-${sha}`);
  });

  it('keeps a release stamp that already carries the commit', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-version-'));
    fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({
      name: 'OpenMarket',
      version: '0.0.1-a3523fa'
    }));

    expect(readAppVersion(directory)).to.equal('0.0.1-a3523fa');
  });

  it('returns the package version when the commit cannot be read', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-version-'));
    fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({
      name: 'OpenMarket',
      version: '0.0.1'
    }));

    expect(readAppVersion(directory)).to.equal('0.0.1');
  });
});
