import {expect} from 'chai';
import 'rxjs/add/operator/mergeMap';
import SafeStorageSecretStore from '../../../../openMarket/infrastructure/plugins/SafeStorageSecretStore';

function database() {
  const rows = [];
  return {
    rows,
    prepare(sql) {
      return {
        run(pluginId, key, ciphertext) {
          if (sql.startsWith('DELETE')) {
            const index = rows.findIndex(row => row.pluginId === pluginId && row.key === key);
            if (index !== -1) {
              rows.splice(index, 1);
            }
            return;
          }
          const index = rows.findIndex(row => row.pluginId === pluginId && row.key === key);
          const row = {pluginId, key, ciphertext};
          if (index === -1) {
            rows.push(row);
          } else {
            rows[index] = row;
          }
        },
        get(pluginId, key) {
          return rows.find(row => row.pluginId === pluginId && row.key === key) || undefined;
        }
      };
    }
  };
}

describe('SafeStorageSecretStore', () => {
  it('round-trips through the bridge and never writes the plaintext', done => {
    const db = database();
    const calls = [];
    const store = new SafeStorageSecretStore({
      connection: {database: db},
      bridge: {
        encrypt(plain) {
          calls.push(['encrypt', plain]);
          return Promise.resolve(Buffer.from('enc:' + plain).toString('base64'));
        },
        decrypt(encoded) {
          calls.push(['decrypt', encoded]);
          return Promise.resolve(Buffer.from(encoded, 'base64').toString('utf8').slice(4));
        },
        status() {
          return Promise.resolve({available: true, backend: 'gnome_libsecret'});
        }
      }
    });

    store.put({pluginId: 'sample', key: 'certificatePassword', value: 's3cret'})
      .flatMap(() => store.get({pluginId: 'sample', key: 'certificatePassword'}))
      .subscribe(value => {
        expect(value).to.equal('s3cret');
        expect(db.rows).to.have.lengthOf(1);
        expect(db.rows[0].ciphertext).to.not.include('s3cret');
        expect(calls[0]).to.deep.equal(['encrypt', 's3cret']);
        expect(calls[1][0]).to.equal('decrypt');
        done();
      }, done);
  });
});
