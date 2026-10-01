import * as homeActions from "./action";
import moment from "moment";
import 'rxjs/add/operator/switchMap';
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

export const makeMostSoldEpic = (productSaleStatistics, readDataUrl) => action$ =>
  action$
    .filter(action => action.type === homeActions.MOST_SOLD_REQUESTED)
    .switchMap(action =>
      productSaleStatistics.mostSold({window: action.window})
        .map(data => homeActions.mostSoldLoaded({
          window: data.window,
          products: (data.products || []).map(product => ({
            barcode: product.barcode,
            name: product.name,
            quantity: product.quantity,
            imageSrc: readDataUrl ? readDataUrl(product.imageName) : null
          }))
        }))
    );



