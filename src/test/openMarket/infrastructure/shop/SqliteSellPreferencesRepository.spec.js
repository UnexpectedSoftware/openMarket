import {expect} from 'chai';
import 'rxjs/add/operator/mergeMap';
import SellPreferences from '../../../../openMarket/domain/shop/SellPreferences';
import SellPreferencesQuery from '../../../../openMarket/domain/shop/SellPreferencesQuery';
import SellPreferencesView from '../../../../openMarket/domain/shop/SellPreferencesView';
import SqliteConnection from '../../../../openMarket/infrastructure/service/SqliteConnection';
import SqliteSellPreferencesRepository from '../../../../openMarket/infrastructure/shop/SqliteSellPreferencesRepository';

const INSERT = 'INSERT INTO setting (key, value_json) VALUES (?, ?) ' +
  'ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json';

describe('SqliteSellPreferencesRepository', () => {
  /** @type {SqliteConnection} */
  let connection;
  /** @type {SqliteSellPreferencesRepository} */
  let repository;

  beforeEach(() => {
    connection = new SqliteConnection({filename: ':memory:'});
    repository = new SqliteSellPreferencesRepository({connection});
  });

  afterEach(() => {
    connection.database.close();
  });

  function store(value) {
    connection.database.prepare(INSERT).run('sell_auto_print', JSON.stringify(value));
  }

  it('maps a legacy auto-print flag and a missing row', done => {
    repository.find(new SellPreferencesQuery())
      .flatMap(missingView => repository.findPreferences().map(missing => ({missingView, missing})))
      .subscribe(({missingView, missing}) => {
        expect(missingView).to.be.instanceof(SellPreferencesView);
        expect(missingView).to.not.be.instanceof(SellPreferences);
        expect(missingView.printMode).to.equal('ask');
        expect(missingView.headerText).to.equal('');
        expect(missingView.footerText).to.equal('');
        expect(missingView.paperWidthMm).to.equal(80);
        expect(missing).to.be.instanceof(SellPreferences);
        expect(missing.printMode).to.equal('ask');
        expect(missing.paperWidthMm).to.equal(80);
        store({autoPrint: false});
        repository.findPreferences().subscribe(off => {
          expect(off.printMode).to.equal('ask');
          expect(off.paperWidthMm).to.equal(80);
          store({autoPrint: true});
          repository.find(new SellPreferencesQuery())
            .flatMap(view => repository.findPreferences().map(profile => ({view, profile})))
            .subscribe(({view, profile}) => {
              expect(view.printMode).to.equal('always');
              expect(view.headerText).to.equal('');
              expect(view.paperWidthMm).to.equal(80);
              expect(profile.printMode).to.equal('always');
              expect(profile.paperWidthMm).to.equal(80);
              done();
            }, done);
        }, done);
      }, done);
  });

  it('keeps a stored print mode ahead of the legacy flag and writes the new JSON', done => {
    store({autoPrint: true, printMode: 'never', headerText: 'Hola', footerText: 'Pie', paperWidthMm: 58});
    repository.find(new SellPreferencesQuery())
      .flatMap(view => {
        expect(view.printMode).to.equal('never');
        expect(view.headerText).to.equal('Hola');
        expect(view.footerText).to.equal('Pie');
        expect(view.paperWidthMm).to.equal(58);
        return repository.findPreferences();
      })
      .flatMap(preferences => repository.save({
        preferences: preferences.withPrintMode('always').withCopy({headerText: 'Gracias', footerText: ''}).withPaperWidth(80)
      }))
      .flatMap(() => repository.find(new SellPreferencesQuery()))
      .subscribe(view => {
        expect(view.printMode).to.equal('always');
        expect(view.headerText).to.equal('Gracias');
        expect(view.footerText).to.equal('');
        expect(view.paperWidthMm).to.equal(80);
        const row = connection.database.prepare(
          'SELECT value_json FROM setting WHERE key = ?'
        ).get('sell_auto_print');
        const json = JSON.parse(row.value_json);
        expect(json).to.deep.equal({
          printMode: 'always',
          headerText: 'Gracias',
          footerText: '',
          paperWidthMm: 80
        });
        expect(json).to.not.have.property('autoPrint');
        done();
      }, done);
  });
});
