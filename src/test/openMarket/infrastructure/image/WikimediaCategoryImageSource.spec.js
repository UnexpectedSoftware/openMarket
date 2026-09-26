import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import WikimediaCategoryImageSource, {
  firstImageUrl,
  normalizeCategoryName
} from '../../../../openMarket/infrastructure/image/WikimediaCategoryImageSource';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

function response({status = 200, body = null, bytes = null, type = 'application/json'}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
    arrayBuffer: () => Promise.resolve(bytes || Buffer.alloc(0)),
    headers: {
      get: () => type
    }
  };
}

function commonsBody(thumburl, mime = 'image/jpeg') {
  return {
    query: {
      pages: {
        1: {
          imageinfo: [{mime, thumburl, url: 'https://upload.example/original.jpg'}]
        }
      }
    }
  };
}

function source(fetchImpl, directory) {
  return new WikimediaCategoryImageSource({
    fetchImpl,
    directory,
    retryDelay: () => Promise.resolve(),
    userAgent: 'OpenMarket/test'
  });
}

describe('Wikimedia category images', () => {
  it('normalizes shop department names', () => {
    expect(normalizeCategoryName('dulces&pasteleria')).to.equal('dulces pasteleria');
    expect(normalizeCategoryName('  CHIPS ')).to.equal('chips');
    expect(firstImageUrl({query: {pages: {'-1': {missing: ''}}}})).to.equal(null);
  });

  it('downloads the pinned thumbnail for a known department', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-commons-'));
    const urls = [];
    const fetchImpl = url => {
      urls.push(url);
      if (url.includes('action=query')) {
        return Promise.resolve(response({
          body: commonsBody('https://thumb.example/chips.jpg')
        }));
      }
      return Promise.resolve(response({bytes: JPEG, type: 'image/jpeg'}));
    };
    const filePath = await source(fetchImpl, directory).findByName({name: 'CHIPS'}).toPromise();
    expect(urls[0]).to.include('Potato-chips.jpg');
    expect(urls[0]).to.include('iiurlwidth=400');
    expect(urls[1]).to.equal('https://thumb.example/chips.jpg');
    expect(path.extname(filePath)).to.equal('.jpg');
    fs.rmSync(directory, {recursive: true, force: true});
  });

  it('uses the pastry file for dulces&pasteleria', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-commons-'));
    const urls = [];
    const fetchImpl = url => {
      urls.push(url);
      if (url.includes('action=query')) {
        return Promise.resolve(response({
          body: commonsBody('https://thumb.example/pastry.jpg')
        }));
      }
      return Promise.resolve(response({bytes: JPEG, type: 'image/jpeg'}));
    };
    const filePath = await source(fetchImpl, directory).findByName({name: 'dulces&pasteleria'}).toPromise();
    expect(urls[0]).to.include('Pastries.jpg');
    expect(urls[1]).to.equal('https://thumb.example/pastry.jpg');
    expect(fs.existsSync(filePath)).to.equal(true);
    fs.rmSync(directory, {recursive: true, force: true});
  });

  it('searches when the department is not pinned', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-commons-'));
    const urls = [];
    const fetchImpl = url => {
      urls.push(url);
      if (url.includes('action=query')) {
        return Promise.resolve(response({
          body: commonsBody('https://thumb.example/fruit.jpg')
        }));
      }
      return Promise.resolve(response({bytes: JPEG, type: 'image/jpeg'}));
    };
    const filePath = await source(fetchImpl, directory).findByName({name: 'Fruta'}).toPromise();
    expect(urls[0]).to.include('generator=search');
    expect(urls[0]).to.include('gsrsearch=fruta');
    expect(urls[0]).to.not.include('titles=');
    expect(fs.existsSync(filePath)).to.equal(true);
    fs.rmSync(directory, {recursive: true, force: true});
  });

  it('returns null when a search has no usable image', async () => {
    const fetchImpl = () => Promise.resolve(response({
      body: {query: {pages: {'-1': {missing: ''}, 2: {imageinfo: [{mime: 'image/svg+xml', thumburl: 'https://thumb.example/a.svg'}]}}}}
    }));
    const filePath = await source(fetchImpl, os.tmpdir()).findByName({name: 'Fruta'}).toPromise();
    expect(filePath).to.equal(null);
  });

  it('searches after a pinned file is missing', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-commons-'));
    const urls = [];
    const fetchImpl = url => {
      urls.push(url);
      if (url.includes('titles=')) {
        return Promise.resolve(response({body: {query: {pages: {'-1': {missing: ''}}}}}));
      }
      if (url.includes('generator=search')) {
        return Promise.resolve(response({body: commonsBody('https://thumb.example/bread.jpg')}));
      }
      return Promise.resolve(response({bytes: JPEG, type: 'image/jpeg'}));
    };
    const filePath = await source(fetchImpl, directory).findByName({name: 'pan'}).toPromise();
    expect(urls[0]).to.include('Bread.jpg');
    expect(urls[1]).to.include('generator=search');
    expect(urls[2]).to.equal('https://thumb.example/bread.jpg');
    expect(fs.existsSync(filePath)).to.equal(true);
    fs.rmSync(directory, {recursive: true, force: true});
  });
});
