import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import {dataUrlForFile, IMAGE_MAX_BYTES} from '../../../../openMarket/infrastructure/service/ImageStore';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

describe('dataUrlForFile', () => {
  it('reads an image and rejects anything that is not a small image file', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-data-url-'));
    const png = path.join(directory, 'photo.png');
    const text = path.join(directory, 'notes.txt');
    const huge = path.join(directory, 'huge.jpg');
    fs.writeFileSync(png, PNG);
    fs.writeFileSync(text, 'hello');
    fs.writeFileSync(huge, Buffer.alloc(IMAGE_MAX_BYTES + 1, 1));

    expect(dataUrlForFile(png)).to.equal(`data:image/png;base64,${PNG.toString('base64')}`);
    expect(dataUrlForFile(text)).to.equal(null);
    expect(dataUrlForFile(huge)).to.equal(null);
    expect(dataUrlForFile(path.join(directory, 'missing.png'))).to.equal(null);
    expect(dataUrlForFile(null)).to.equal(null);

    fs.rmSync(directory, {recursive: true, force: true});
  });
});
