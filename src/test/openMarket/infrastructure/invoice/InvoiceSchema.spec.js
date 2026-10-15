import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import {DatabaseSync} from 'node:sqlite';
import SqliteConnection from '../../../../openMarket/infrastructure/service/SqliteConnection';

function temporaryDatabase() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-invoice-migrate-'));
  return {directory, filename: path.join(directory, 'legacy.sqlite')};
}

describe('invoice amount migration', () => {
  it('fills a missing line amount once from the order calculation', () => {
    const {directory, filename} = temporaryDatabase();
    try {
      const raw = new DatabaseSync(filename);
      raw.exec(
        'CREATE TABLE invoice_line (' +
        'invoice_id TEXT NOT NULL, position INTEGER NOT NULL, barcode TEXT NOT NULL, ' +
        'name TEXT NOT NULL, price REAL NOT NULL, quantity REAL NOT NULL, ' +
        'PRIMARY KEY (invoice_id, position))'
      );
      raw.prepare(
        'INSERT INTO invoice_line (invoice_id, position, barcode, name, price, quantity) ' +
        'VALUES (?, ?, ?, ?, ?, ?)'
      ).run('inv', 0, '1', 'Milk', 0.1, 3);
      raw.close();

      const connection = new SqliteConnection({filename});
      const row = connection.database.prepare(
        'SELECT price, quantity, amount FROM invoice_line WHERE invoice_id = ?'
      ).get('inv');
      expect(row).to.deep.equal({price: 0.1, quantity: 3, amount: 0.3});
      connection.database.close();
    } finally {
      fs.rmSync(directory, {recursive: true, force: true});
    }
  });

  it('leaves an amount that is already stored', () => {
    const {directory, filename} = temporaryDatabase();
    try {
      const raw = new DatabaseSync(filename);
      raw.exec(
        'CREATE TABLE invoice_line (' +
        'invoice_id TEXT NOT NULL, position INTEGER NOT NULL, barcode TEXT NOT NULL, ' +
        'name TEXT NOT NULL, price REAL NOT NULL, quantity REAL NOT NULL, amount REAL, ' +
        'PRIMARY KEY (invoice_id, position))'
      );
      const insert = raw.prepare(
        'INSERT INTO invoice_line (invoice_id, position, barcode, name, price, quantity, amount) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      insert.run('inv', 0, '1', 'Milk', 0.1, 3, null);
      insert.run('inv', 1, '2', 'Bread', 0.1, 3, 7.77);
      raw.close();

      const connection = new SqliteConnection({filename});
      const rows = connection.database.prepare(
        'SELECT position, amount FROM invoice_line WHERE invoice_id = ? ORDER BY position'
      ).all('inv');
      expect(rows).to.deep.equal([
        {position: 0, amount: 0.3},
        {position: 1, amount: 7.77}
      ]);
      connection.database.close();
    } finally {
      fs.rmSync(directory, {recursive: true, force: true});
    }
  });
});
