import {ipcRenderer} from 'electron';
import {success, error} from 'react-notification-system-redux';
import OpenMarket from '../../application/index';
import {categoriesPageLoaded} from '../category/action';
import {listProductsFetch} from '../product/list_products/action';
import {listProductFetch} from '../product/list_products_low_stock/action';
import {imageFetchFinished, imageFetchProgressed} from './action';
import {FETCH_IMAGES_CHANNEL} from './channel';
import {makeFetchImagesEpic} from './epicFactory';

const fetchImagesEpic = makeFetchImagesEpic({
  fetchCatalogImages: OpenMarket.get('images_fetch_use_case'),
  successNotification: success,
  errorNotification: error,
  listen(onFetch) {
    ipcRenderer.on(FETCH_IMAGES_CHANNEL, onFetch);
    return () => ipcRenderer.removeListener(FETCH_IMAGES_CHANNEL, onFetch);
  },
  categoriesPageLoaded,
  listProductsFetch,
  listProductFetch,
  imageFetchProgressed,
  imageFetchFinished
});

export default fetchImagesEpic;
