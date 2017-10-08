import * as homeActions from "./action";
import moment from "moment";

const startDate = moment().day(-7);
const endDate = moment();

/*const startDate = moment('2004-12-31 00:00:00','YYYY-MM-DD HH:mm:ss');
const endDate = moment('2005-01-06 23:59:59','YYYY-MM-DD HH:mm:ss');*/

console.log(startDate.isValid());
console.log(endDate.isValid());

export const makeHomePageLoadedEpic = ordersStatisticsUseCase => action$ =>
  action$
    .filter(action => action.type === homeActions.HOME_PAGE_LOADED)
    .flatMap(action => ordersStatisticsUseCase.calculateTotalAmountByDays({startDate, endDate}))
    .map(data => homeActions.homePageStatisticsTotalAmountByDayLoaded(data));



