import {expect} from 'chai';
import SqliteInvoiceSequence from '../../../../openMarket/infrastructure/invoice/SqliteInvoiceSequence';

describe('SqliteInvoiceSequence peek', () => {
  function open(start) {
    let last = start;
    const ran = [];
    const database = {
      prepare(statement) {
        return {
          get() {
            ran.push(statement);
            if (statement.indexOf('INSERT') === 0) {
              last += 1;
            }
            return last == null ? undefined : {last_number: last};
          }
        };
      }
    };
    return {sequence: new SqliteInvoiceSequence({connection: {database}}), ran, lastNumber: () => last};
  }

  it('reads the following number and does not insert', done => {
    const opened = open(41);
    opened.sequence.peek({series: '2026'}).subscribe(number => {
      expect(number.formatted).to.equal('2026/000042');
      expect(opened.lastNumber()).to.equal(41);
      opened.sequence.peek({series: '2026'}).subscribe(again => {
        expect(again.formatted).to.equal('2026/000042');
        expect(opened.ran.every(statement => statement.indexOf('SELECT') === 0)).to.equal(true);
        done();
      }, done);
    }, done);
  });

  it('starts at one when the series has no row', done => {
    open(null).sequence.peek({series: '2026'}).subscribe(number => {
      expect(number.formatted).to.equal('2026/000001');
      done();
    }, done);
  });
});
