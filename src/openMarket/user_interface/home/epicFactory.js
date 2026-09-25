import * as homeActions from "./action";
import moment from "moment";
import container from '../../infrastructure/dic/Container'

const calculationDays = container.environment.config.maxDaysStatisticsCount;

export const makeHomePageLoadedEpic = ordersStatisticsUseCase => action$ =>
  action$
    .filter(action => action.type === homeActions.HOME_PAGE_LOADED)
    .flatMap(() => {
      const endDate = moment();
      const startDate = moment().subtract(calculationDays, 'days');
      return ordersStatisticsUseCase.calculateTotalAmountByDays({startDate, endDate});
    })
    .map(data => homeActions.homePageStatisticsTotalAmountByDayLoaded(data));



