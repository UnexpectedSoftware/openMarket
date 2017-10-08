import * as homeActions from "./action";
import moment from "moment";

const startDate = moment().day(-7);
const endDate = moment();


export const makeHomePageLoadedEpic = ordersStatisticsUseCase => action$ =>
  action$
    .filter(action => action.type === homeActions.HOME_PAGE_LOADED)
    .flatMap(action => ordersStatisticsUseCase.calculateTotalAmountByDays({startDate, endDate}))
    .map(data => homeActions.homePageStatisticsTotalAmountByDayLoaded(data));



