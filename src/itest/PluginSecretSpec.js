import {expect} from 'chai';
import fs from 'fs';
import os from 'os';
import path from 'path';
import SqliteConnection from '../openMarket/infrastructure/service/SqliteConnection';
import SafeStorageSecretStore from '../openMarket/infrastructure/plugins/SafeStorageSecretStore';

describe('Plugin secrets', () => {
  const filename = path.join(os.tmpdir(), `openmarket-secrets-${process.pid}-${Date.now()}.sqlite`);

  afterEach(() => {
    fs.rmSync(filename, {force: true});
    fs.rmSync(filename + '-wal', {force: true});
    fs.rmSync(filename + '-shm', {force: true});
  });

  it('stores ciphertext only', done => {
    const connection = new SqliteConnection({filename});
    const store = new SafeStorageSecretStore({
      connection,
      bridge: {
        encrypt(plain) {
          return Promise.resolve(Buffer.from('enc:' + plain).toString('base64'));
        },
        decrypt(encoded) {
          return Promise.resolve(Buffer.from(encoded, 'base64').toString('utf8').slice(4));
        },
        status() {
          return Promise.resolve({available: true, backend: 'basic_text'});
        }
      }
    });

    store.put({pluginId: 'sample', key: 'certificatePassword', value: 's3cret'})
      .subscribe(() => {
        const row = connection.database.prepare(
          'SELECT ciphertext FROM plugin_secret WHERE plugin_id = ? AND key = ?'
        ).get('sample', 'certificatePassword');
        expect(row.ciphertext).to.be.a('string');
        expect(row.ciphertext).to.not.equal('s3cret');
        expect(row.ciphertext).to.not.include('s3cret');
        connection.database.close();
        done();
      }, error => {
        connection.database.close();
        done(error);
      });
  });
});
