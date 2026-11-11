import {expect} from 'chai';
import * as Rx from 'rxjs';
import SqliteConnection from '../../../../openMarket/infrastructure/service/SqliteConnection';
import SqliteTransaction from '../../../../openMarket/infrastructure/service/SqliteTransaction';

function categories(database) {
  return database.prepare('SELECT id FROM category ORDER BY id').all().map(row => row.id);
}

function insert(database, id) {
  return Rx.Observable.defer(() => {
    database.prepare('INSERT INTO category (id, name) VALUES (?, ?)').run(id, id);
    return Rx.Observable.of(id);
  });
}

describe('SqliteTransaction', () => {
  it('joins an open transaction, so the outer rollback undoes the inner work', () => {
    const connection = new SqliteConnection({filename: ':memory:'});
    const transaction = new SqliteTransaction({connection});
    const emitted = [];

    expect(() => transaction.execute(() => {
      transaction.run(() => insert(connection.database, 'inner')).subscribe(value => emitted.push(value));
      expect(transaction.inTransaction()).to.equal(true);
      throw new Error('outer failed');
    })).to.throw('outer failed');

    expect(emitted).to.deep.equal(['inner']);
    expect(categories(connection.database)).to.deep.equal([]);
    expect(transaction.inTransaction()).to.equal(false);
  });

  it('commits its own work when no transaction is open', () => {
    const connection = new SqliteConnection({filename: ':memory:'});
    const transaction = new SqliteTransaction({connection});

    const open = [];
    transaction.run(() => {
      open.push(transaction.inTransaction());
      return insert(connection.database, 'own');
    }).subscribe(() => open.push(transaction.inTransaction()));

    expect(open).to.deep.equal([true, false]);

    expect(transaction.inTransaction()).to.equal(false);
    expect(categories(connection.database)).to.deep.equal(['own']);
  });
});
