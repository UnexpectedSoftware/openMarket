import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect } from 'chai';
import { installDemoImages } from '../../../../openMarket/infrastructure/dev/demoImages';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('Demo images', () => {
  it('writes one PNG per named product', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'om-demo-images-'));
    try {
      installDemoImages({
        directory,
        products: [
          {_imageName: '1001.png'},
          {_imageName: null},
          {_imageName: '../escape.png'},
          {_imageName: '1002.png'}
        ]
      });
      const files = fs.readdirSync(directory).sort();
      expect(files).to.deep.equal(['1001.png', '1002.png']);
      files.forEach(file => {
        expect(fs.readFileSync(path.join(directory, file)).subarray(0, 8)).to.deep.equal(PNG);
      });
    } finally {
      fs.rmSync(directory, {recursive: true, force: true});
    }
  });

  it('does nothing without a directory', () => {
    expect(() => installDemoImages({products: [{_imageName: '1001.png'}]})).to.not.throw();
  });
});
