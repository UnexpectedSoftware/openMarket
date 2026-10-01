import { expect } from 'chai';
import {
  HOME_PAGE_LOADED,
  HOME_PAGE_STATISTICS_TOTAL_AMOUNT_BY_DAYS_LOADED,
  MOST_SOLD_LOADED,
  MOST_SOLD_REQUESTED
} from "../../../../openMarket/user_interface/home/action";
import {makeHomePageLoadedEpic, makeMostSoldEpic} from "../../../../openMarket/user_interface/home/epicFactory";
import * as Rx from "rxjs";

describe('Home Epics', () => {
  describe('Home page loaded', () => {
    it('should return an action of type HOME_PAGE_STATISTICS_TOTAL_AMOUNT_BY_DAYS_LOADED', (done) => {

      const givenActions$ = Rx.Observable.of({
        type: HOME_PAGE_LOADED
      });

      const orderStatisticsUseCaseMock = {
        calculateTotalAmountByDays: ({startDate,endDate}) => Rx.Observable.of([
          {
            total: 5.55,
            createdAt: '15/05/2017'
          },
          {
            total: 1.25,
            createdAt: '16/05/2017'
          }
        ])
      };

      const homePageLoadedEpic = makeHomePageLoadedEpic(orderStatisticsUseCaseMock);

      const actions$ = homePageLoadedEpic(givenActions$);


      const expectedActions ={
          type: HOME_PAGE_STATISTICS_TOTAL_AMOUNT_BY_DAYS_LOADED,
          payload: [
            {
            total: 5.55,
            createdAt: '15/05/2017'
            },
            {
              total: 1.25,
              createdAt: '16/05/2017'
            }
          ]
        };

      actions$
        .subscribe(
          actions => {
            expect(actions).to.deep.equal(expectedActions);
          },
          (error) => done(new Error(error)),
          () => done()
        );

    });
  });

  describe('Most sold requested', () => {
    it('should return the ranked products for the selected window', (done) => {
      const givenActions$ = Rx.Observable.of({
        type: MOST_SOLD_REQUESTED,
        window: 'month'
      });
      const productSaleStatistics = {
        mostSold: ({window}) => Rx.Observable.of({
          window,
          products: [{
            barcode: '0001',
            name: 'Cola',
            quantity: 4,
            amount: 2,
            previousQuantity: 2,
            imageName: '0001.png'
          }]
        })
      };

      makeMostSoldEpic(productSaleStatistics, () => 'data:image/png;base64,aa')(givenActions$)
        .subscribe(
          action => {
            expect(action).to.deep.equal({
              type: MOST_SOLD_LOADED,
              payload: {
                window: 'month',
                products: [{
                  barcode: '0001',
                  name: 'Cola',
                  quantity: 4,
                  previousQuantity: 2,
                  imageSrc: 'data:image/png;base64,aa'
                }]
              }
            });
          },
          error => done(new Error(error)),
          () => done()
        );
    });
  });
});
