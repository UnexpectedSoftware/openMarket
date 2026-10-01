import OpenMarket from "../../application/index";
import * as Rx from "rxjs";
import {push} from 'react-router-redux';
import {makeHomePageLoadedEpic, makeMostSoldEpic} from './epicFactory';

const orderStatisticsCase = OpenMarket.get("orders_statistics_use_case");
const productSaleStatistics = OpenMarket.get("product_sale_statistics_use_case");
const homePageLoadedEpic = makeHomePageLoadedEpic(orderStatisticsCase);
const mostSoldEpic = makeMostSoldEpic(productSaleStatistics);


export default action$ =>
  Rx.Observable.merge(
    homePageLoadedEpic(action$),
    mostSoldEpic(action$)
  ).do(() => null,error => console.log(error),()=> null)


