import * as Rx from 'rxjs';
import 'rxjs/add/operator/do';
import OpenMarket from '../../application/index';
import {record} from '../../infrastructure/logging/ErrorLog';
import {makeReportSummaryEpic} from './epicFactory';

const reports = OpenMarket.get('reports_summary_use_case');

export default action$ =>
  Rx.Observable.merge(
    makeReportSummaryEpic(reports)(action$)
  ).do(() => null, error => record(error), () => null);
