import {expect} from 'chai';
import {closeCustom, customRejected, selectRange, state, summaryFailed, summaryLoaded} from '../../../../openMarket/user_interface/report/model';

describe('report model', () => {
  it('starts on the last seven days and replaces the summary for a new range', () => {
    const initial = state();
    expect(initial.rangeKey).to.equal('week');
    expect(initial.loading).to.equal(true);
    const selected = selectRange(initial, {
      key: 'today',
      from: '2026-11-09 00:00:00',
      to: '2026-11-09 23:59:59'
    });
    expect(selected.rangeKey).to.equal('today');
    expect(selected.loading).to.equal(true);
    expect(selected.customOpen).to.equal(false);
    const loaded = summaryLoaded(selected, {summary: {salesCents: 10}});
    expect(loaded.loading).to.equal(false);
    expect(loaded.summary.salesCents).to.equal(10);
  });

  it('keeps the custom dialog error and clears the summary on failure', () => {
    const failed = summaryFailed(state(), {message: 'no'});
    expect(failed.error).to.equal('no');
    expect(failed.summary).to.equal(null);
    expect(failed.loading).to.equal(false);
    const rejected = customRejected(closeCustom(state()), {message: 'Elige las dos fechas'});
    expect(rejected.customOpen).to.equal(false);
    expect(rejected.customError).to.equal('Elige las dos fechas');
  });
});
