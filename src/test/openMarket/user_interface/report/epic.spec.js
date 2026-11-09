import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/toArray';
import {REPORT_RANGE_SELECTED} from '../../../../openMarket/user_interface/report/action';
import {makeReportSummaryEpic} from '../../../../openMarket/user_interface/report/epicFactory';

const range = {
  type: REPORT_RANGE_SELECTED,
  key: 'week',
  from: '2026-11-03 00:00:00',
  to: '2026-11-09 23:59:59'
};

describe('makeReportSummaryEpic', () => {
  it('loads the summary for the selected range', done => {
    let query;
    const epic = makeReportSummaryEpic({
      load: params => {
        query = params;
        return Rx.Observable.of({salesCents: 10});
      }
    });
    epic(Rx.Observable.of(range)).toArray().subscribe(actions => {
      expect(query).to.deep.equal({from: range.from, to: range.to});
      expect(actions).to.deep.equal([{type: 'REPORT_SUMMARY_LOADED', summary: {salesCents: 10}}]);
      done();
    }, done);
  });

  it('reports a failure without dropping the stream', done => {
    const epic = makeReportSummaryEpic({
      load: () => Rx.Observable.throw(new Error('down'))
    });
    epic(Rx.Observable.of(range)).subscribe(action => {
      expect(action.type).to.equal('REPORT_SUMMARY_FAILED');
      expect(action.message).to.equal('down');
      done();
    }, done);
  });
});
