import OpenMarket from "../../application/index";
import * as Rx from "rxjs";
import {push} from 'react-router-redux';
import ImageStore, {imagesDirectory} from '../../infrastructure/service/ImageStore';
import {record} from '../../infrastructure/logging/ErrorLog';
import {makeHomePageLoadedEpic, makeMostSoldEpic} from './epicFactory';

const productImages = new ImageStore({directory: imagesDirectory('product-images')});
const orderStatisticsCase = OpenMarket.get("orders_statistics_use_case");
const productSaleStatistics = OpenMarket.get("product_sale_statistics_use_case");
const homePageLoadedEpic = makeHomePageLoadedEpic(orderStatisticsCase);
const mostSoldEpic = makeMostSoldEpic(
  productSaleStatistics,
  imageName => productImages.readDataUrl(imageName)
);


export default action$ =>
  Rx.Observable.merge(
    homePageLoadedEpic(action$),
    mostSoldEpic(action$)
  ).do(() => null, error => record(error), () => null)


