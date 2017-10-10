import * as homeActions from "./action";
import moment from "moment";
import container from '../../infrastructure/dic/Container'

const calculationDays = container.environment.config.maxDaysStatisticsCount;
const startDate = moment().subtract(calculationDays, 'days');
const endDate = moment();

export const makeHomePageLoadedEpic = ordersStatisticsUseCase => action$ =>
  action$
    .filter(action => action.type === homeActions.HOME_PAGE_LOADED)
    .flatMap(action => ordersStatisticsUseCase.calculateTotalAmountByDays({startDate, endDate}))
    .map(data => homeActions.homePageStatisticsTotalAmountByDayLoaded(data));



