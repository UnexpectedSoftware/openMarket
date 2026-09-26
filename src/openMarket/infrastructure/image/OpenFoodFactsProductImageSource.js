import os from 'os';
import * as Rx from 'rxjs';
import ProductImageSource from '../../domain/image/ProductImageSource';
import {isProductBarcode} from '../../domain/image/barcode';
import {IMAGE_MAX_BYTES} from '../service/ImageStore';
import {fetchWithRetry, pause, writeFetchedImage} from './downloadImage';

export function openMarketUserAgent() {
  const version = process.env.OPENMARKET_VERSION || 'dev';
  return `OpenMarket/${version} (https://github.com/UnexpectedSoftware/openMarket)`;
}

export function frontDisplayUrl(product) {
  const selected = product && product.selected_images;
  const front = selected && selected.front;
  const display = front && front.display;
  if (!display || typeof display !== 'object') {
    return null;
  }
  if (typeof display.es === 'string' && display.es) {
    return display.es;
  }
  if (typeof display.en === 'string' && display.en) {
    return display.en;
  }
  const keys = Object.keys(display);
  for (let index = 0; index < keys.length; index += 1) {
    const value = display[keys[index]];
    if (typeof value === 'string' && value) {
      return value;
    }
  }
  return null;
}

export function rawFrontUrl(code) {
  const match = String(code).match(/^(.{3})(.{3})(.{3})(.*)$/);
  const folder = `${match[1]}/${match[2]}/${match[3]}/${match[4]}`;
  return `https://images.openfoodfacts.org/images/products/${folder}/1.400.jpg`;
}

export default class OpenFoodFactsProductImageSource extends ProductImageSource {
  constructor({
    fetchImpl = fetch,
    userAgent = openMarketUserAgent(),
    directory = os.tmpdir(),
    retryDelay = () => pause(1000),
    maxBytes = IMAGE_MAX_BYTES
  } = {}) {
    super();
    this._fetch = fetchImpl;
    this._headers = {'User-Agent': userAgent};
    this._directory = directory;
    this._retryDelay = retryDelay;
    this._maxBytes = maxBytes;
  }

  findByBarcode({barcode}) {
    return Rx.Observable.defer(() => Rx.Observable.fromPromise(this._find(barcode)));
  }

  async _find(barcode) {
    if (!isProductBarcode(barcode)) {
      return null;
    }
    const code = String(barcode).padStart(13, '0');
    const response = await this._request(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=code,selected_images,images`
    );
    if (response.status === 429) {
      return null;
    }
    let imageUrl = null;
    if (response.ok) {
      try {
        const body = await response.json();
        imageUrl = frontDisplayUrl(body && body.product);
      } catch (error) {
        imageUrl = null;
      }
    }
    if (!imageUrl) {
      imageUrl = rawFrontUrl(code);
    }
    const imageResponse = await this._request(imageUrl);
    if (imageResponse.status === 429) {
      return null;
    }
    return writeFetchedImage({
      response: imageResponse,
      directory: this._directory,
      maxBytes: this._maxBytes,
      prefix: 'openfoodfacts-'
    });
  }

  _request(url) {
    return fetchWithRetry({
      fetchImpl: this._fetch,
      url,
      headers: this._headers,
      retryDelay: this._retryDelay
    });
  }
}
