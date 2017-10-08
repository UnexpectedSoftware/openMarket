import OpenMarket from "../../application/index";
import * as Rx from "rxjs";
import {push} from 'react-router-redux';
import {makeHomePageLoadedEpic} from './epicFactory';

const orderStatisticsCase = OpenMarket.get("orders_statistics_use_case");
const homePageLoadedEpic = makeHomePageLoadedEpic(orderStatisticsCase);


export default action$ =>
  Rx.Observable.merge(
    homePageLoadedEpic(action$)
  ).do(() => null,error => console.log(error),()=> null)


