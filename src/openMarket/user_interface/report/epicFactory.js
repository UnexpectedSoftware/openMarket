import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import {record, userText} from '../../infrastructure/logging/ErrorLog';
import {REPORT_RANGE_SELECTED, reportSummaryFailed, reportSummaryLoaded} from './action';

/**
 * The latest range wins.
 * @param {{load: Function}} reports
 */
export function makeReportSummaryEpic(reports) {
  return action$ => action$
    .filter(action => action.type === REPORT_RANGE_SELECTED)
    .switchMap(action => reports.load({from: action.from, to: action.to})
      .map(summary => reportSummaryLoaded(summary))
      .catch(error => {
        record(error);
        return Rx.Observable.of(reportSummaryFailed(userText(error, 'No se ha podido cargar el resumen')));
      }));
}
