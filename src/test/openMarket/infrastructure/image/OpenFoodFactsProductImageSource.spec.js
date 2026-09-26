import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import OpenFoodFactsProductImageSource, {
  frontDisplayUrl,
  rawFrontUrl
} from '../../../../openMarket/infrastructure/image/OpenFoodFactsProductImageSource';

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

function source(fetchImpl, directory, maxBytes) {
  return new OpenFoodFactsProductImageSource({
    fetchImpl,
    directory,
    retryDelay: () => Promise.resolve(),
    userAgent: 'OpenMarket/test',
    maxBytes
  });
}

describe('Open Food Facts product images', () => {
  it('prefers the Spanish front and splits a padded barcode into folders', () => {
    expect(frontDisplayUrl({
      selected_images: {front: {display: {en: 'https://images.example/en.jpg', es: 'https://images.example/es.jpg'}}}
    })).to.equal('https://images.example/es.jpg');
    expect(frontDisplayUrl({
      selected_images: {front: {display: {fr: 'https://images.example/fr.jpg'}}}
    })).to.equal('https://images.example/fr.jpg');
    expect(frontDisplayUrl({})).to.equal(null);
    expect(rawFrontUrl('3435660768163')).to.equal(
      'https://images.openfoodfacts.org/images/products/343/566/076/8163/1.400.jpg'
    );
    expect(rawFrontUrl('0000080135463')).to.equal(
      'https://images.openfoodfacts.org/images/products/000/008/013/5463/1.400.jpg'
    );
  });

  it('downloads the selected front for a padded barcode', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-off-'));
    const urls = [];
    const fetchImpl = url => {
      urls.push(url);
      if (url.includes('/api/')) {
        return Promise.resolve(response({
          body: {
            product: {
              selected_images: {
                front: {display: {en: 'https://images.example/en.jpg', es: 'https://images.example/es.jpg'}}
              }
            }
          }
        }));
      }
      return Promise.resolve(response({bytes: JPEG, type: 'image/jpeg'}));
    };
    const filePath = await source(fetchImpl, directory).findByBarcode({barcode: '80135463'}).toPromise();
    expect(urls[0]).to.include('/product/0000080135463.json');
    expect(urls[1]).to.equal('https://images.example/es.jpg');
    expect(path.extname(filePath)).to.equal('.jpg');
    expect(fs.readFileSync(filePath).equals(JPEG)).to.equal(true);
    fs.rmSync(directory, {recursive: true, force: true});
  });

  it('falls back to the raw 400px image when the product has no front', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-off-'));
    const urls = [];
    const fetchImpl = url => {
      urls.push(url);
      if (url.includes('/api/')) {
        return Promise.resolve(response({status: 404}));
      }
      return Promise.resolve(response({bytes: JPEG, type: 'image/jpeg'}));
    };
    const filePath = await source(fetchImpl, directory).findByBarcode({barcode: '3435660768163'}).toPromise();
    expect(urls[1]).to.equal(rawFrontUrl('3435660768163'));
    expect(fs.existsSync(filePath)).to.equal(true);
    fs.rmSync(directory, {recursive: true, force: true});
  });

  it('retries a rate limit once', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-off-'));
    let apiCalls = 0;
    const fetchImpl = url => {
      if (url.includes('/api/')) {
        apiCalls += 1;
        if (apiCalls === 1) {
          return Promise.resolve(response({status: 429}));
        }
        return Promise.resolve(response({
          body: {product: {selected_images: {front: {display: {es: 'https://images.example/es.jpg'}}}}}
        }));
      }
      return Promise.resolve(response({bytes: JPEG, type: 'image/jpeg'}));
    };
    const filePath = await source(fetchImpl, directory).findByBarcode({barcode: '8410010000181'}).toPromise();
    expect(apiCalls).to.equal(2);
    expect(filePath).to.be.a('string');
    fs.rmSync(directory, {recursive: true, force: true});
  });

  it('stops after a second rate limit and does not download', async () => {
    const urls = [];
    const fetchImpl = url => {
      urls.push(url);
      return Promise.resolve(response({status: 429}));
    };
    const filePath = await source(fetchImpl, os.tmpdir()).findByBarcode({barcode: '8410010000181'}).toPromise();
    expect(filePath).to.equal(null);
    expect(urls).to.have.length(2);
    urls.forEach(url => expect(url).to.include('/api/'));
  });

  it('does not look up a short shop code', async () => {
    let called = false;
    const fetchImpl = () => {
      called = true;
      return Promise.resolve(response({}));
    };
    const filePath = await source(fetchImpl, os.tmpdir()).findByBarcode({barcode: '62'}).toPromise();
    expect(filePath).to.equal(null);
    expect(called).to.equal(false);
  });

  it('rejects a response that is not an image and a file over the size limit', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-off-'));
    const textFetch = url => {
      if (url.includes('/api/')) {
        return Promise.resolve(response({
          body: {product: {selected_images: {front: {display: {es: 'https://images.example/es.txt'}}}}}
        }));
      }
      return Promise.resolve(response({bytes: Buffer.from('hello'), type: 'text/plain'}));
    };
    const textPath = await source(textFetch, directory).findByBarcode({barcode: '8410010000181'}).toPromise();
    expect(textPath).to.equal(null);

    const hugeFetch = url => {
      if (url.includes('/api/')) {
        return Promise.resolve(response({status: 404}));
      }
      return Promise.resolve(response({bytes: JPEG, type: 'image/jpeg'}));
    };
    const hugePath = await source(hugeFetch, directory, 3).findByBarcode({barcode: '8410010000181'}).toPromise();
    expect(hugePath).to.equal(null);
    fs.rmSync(directory, {recursive: true, force: true});
  });
});
