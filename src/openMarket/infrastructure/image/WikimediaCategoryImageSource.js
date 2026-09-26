import os from 'os';
import * as Rx from 'rxjs';
import CategoryImageSource from '../../domain/image/CategoryImageSource';
import {IMAGE_MAX_BYTES} from '../service/ImageStore';
import {fetchWithRetry, IMAGE_EXTENSIONS, pause, writeFetchedImage} from './downloadImage';
import {openMarketUserAgent} from './OpenFoodFactsProductImageSource';

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

export const CATEGORY_FILES = {
  chips: 'File:Potato-chips.jpg',
  conservas: 'File:Canned and pickled goods.jpg',
  refrescos: 'File:Soft drink shelf 2.jpg',
  'dulces pasteleria': 'File:Pastries.jpg',
  arrozesypastas: 'File:Pasta.jpg',
  'arroces y pastas': 'File:Pasta.jpg',
  'caldos sopas': 'File:Tomato soup.jpg',
  'leche batidos': 'File:Glass of milk.jpg',
  pan: 'File:Bread.jpg'
};

export function normalizeCategoryName(name) {
  return String(name || '').toLowerCase().replace(/&/g, ' ').replace(/\s+/g, ' ').trim();
}

export function firstImageUrl(body) {
  const pages = body && body.query && body.query.pages;
  if (!pages) {
    return null;
  }
  const keys = Object.keys(pages);
  for (let index = 0; index < keys.length; index += 1) {
    const page = pages[keys[index]];
    if (!page || page.missing) {
      continue;
    }
    const info = page.imageinfo && page.imageinfo[0];
    if (!info) {
      continue;
    }
    const mime = String(info.mime || '').split(';')[0].trim().toLowerCase();
    if (!IMAGE_EXTENSIONS[mime]) {
      continue;
    }
    if (info.thumburl) {
      return info.thumburl;
    }
    if (info.url) {
      return info.url;
    }
  }
  return null;
}

function commonsUrl(params) {
  return COMMONS_API + '?' + new URLSearchParams(params).toString();
}

export default class WikimediaCategoryImageSource extends CategoryImageSource {
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

  findByName({name}) {
    return Rx.Observable.defer(() => Rx.Observable.fromPromise(this._find(name)));
  }

  async _find(name) {
    const normalized = normalizeCategoryName(name);
    if (!normalized) {
      return null;
    }
    const pinned = CATEGORY_FILES[normalized];
    if (pinned) {
      const pinnedUrl = await this._imageUrl(commonsUrl({
        action: 'query',
        titles: pinned,
        prop: 'imageinfo',
        iiprop: 'url|mime|size',
        iiurlwidth: '400',
        format: 'json'
      }));
      if (pinnedUrl) {
        return this._save(pinnedUrl);
      }
    }
    const searchedUrl = await this._imageUrl(commonsUrl({
      action: 'query',
      generator: 'search',
      gsrsearch: normalized,
      gsrnamespace: '6',
      gsrlimit: '8',
      prop: 'imageinfo',
      iiprop: 'url|mime|size',
      iiurlwidth: '400',
      format: 'json'
    }));
    if (!searchedUrl) {
      return null;
    }
    return this._save(searchedUrl);
  }

  async _imageUrl(url) {
    const response = await fetchWithRetry({
      fetchImpl: this._fetch,
      url,
      headers: this._headers,
      retryDelay: this._retryDelay
    });
    if (!response.ok || response.status === 429) {
      return null;
    }
    try {
      return firstImageUrl(await response.json());
    } catch (error) {
      return null;
    }
  }

  _save(url) {
    return fetchWithRetry({
      fetchImpl: this._fetch,
      url,
      headers: this._headers,
      retryDelay: this._retryDelay
    }).then(response => {
      if (response.status === 429) {
        return null;
      }
      return writeFetchedImage({
        response,
        directory: this._directory,
        maxBytes: this._maxBytes,
        prefix: 'commons-'
      });
    });
  }
}
