import {expect} from 'chai';
import openMarket from '../openMarket/application/index';
import container from '../openMarket/infrastructure/dic/Container';

const database = container.getInstance({key: 'sqliteConnection'}).database;
const repository = container.getInstance({key: 'appearancePreferencesRepository'});
const changeTheme = openMarket.get('appearance_change_theme_use_case');
const getAppearance = openMarket.get('appearance_get_use_case');

describe('Appearance preferences', () => {
  beforeEach(() => {
    database.prepare('DELETE FROM setting WHERE key = ?').run('appearance');
  });

  afterEach(() => {
    database.prepare('DELETE FROM setting WHERE key = ?').run('appearance');
  });

  it('returns Mercado when the setting row is missing', done => {
    getAppearance.get().subscribe(preferences => {
      expect(preferences.theme.id).to.equal('mercado');
      done();
    }, done);
  });

  it('saves a theme and reads it back from the setting table', done => {
    changeTheme.changeTheme({theme: 'ultramarinos'}).subscribe(() => {
      repository.find().subscribe(preferences => {
        const row = database.prepare('SELECT value_json FROM setting WHERE key = ?').get('appearance');
        expect(preferences.theme.id).to.equal('ultramarinos');
        expect(JSON.parse(row.value_json).theme).to.equal('ultramarinos');
        done();
      }, done);
    }, done);
  });
});
