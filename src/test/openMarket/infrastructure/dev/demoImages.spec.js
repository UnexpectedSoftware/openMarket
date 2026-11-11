import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect } from 'chai';
import { writeDemoImages } from '../../../../openMarket/infrastructure/dev/demoImages';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('Demo images', () => {
  it('writes one PNG per product that shows a photo', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'om-demo-images-'));
    const directory = path.join(root, 'nested');
    try {
      const paths = writeDemoImages({
        directory,
        products: [
          {barcode: '1001', image: true},
          {barcode: '1003', image: false},
          {barcode: '1002', image: true}
        ]
      });
      expect([...paths.entries()]).to.deep.equal([
        ['1001', path.join(directory, '1001.png')],
        ['1002', path.join(directory, '1002.png')]
      ]);
      expect(fs.readdirSync(directory).sort()).to.deep.equal(['1001.png', '1002.png']);
      paths.forEach(file => {
        expect(fs.readFileSync(file).subarray(0, 8)).to.deep.equal(PNG);
      });
      expect(fs.readFileSync(paths.get('1001'))).to.not.deep.equal(fs.readFileSync(paths.get('1002')));
    } finally {
      fs.rmSync(root, {recursive: true, force: true});
    }
  });
});
