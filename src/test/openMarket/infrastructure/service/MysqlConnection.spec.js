import { expect } from 'chai';
import * as Rx from "rxjs";
import sinon from 'sinon';
import MysqlConnection from "../../../../openMarket/infrastructure/service/MysqlConnection";

describe('MysqlConnection Service', () => {
  describe('when execute a query with a collection of n response rows', () => {
    it('should return an Observable with n rows', (done) => {

      const poolMock = {
        getPool: () => Rx.Observable.of({
          query: (query,params) => Promise.resolve([[{key:1},{key:2}],{}])
        })
      };

      const mysqlConnection = new MysqlConnection({pool$: poolMock});
      const spyNext = sinon.spy();

      mysqlConnection.execute({
        query: 'SELECT * FROM PRODUCTS',
        params: [{},{}]
      })
        .toArray()
        .subscribe(
          (data) => {
            expect(data[0]).to.deep.equals({key:1});
            expect(data[1]).to.deep.equals({key:2});
            spyNext();
          },
          (error) => done(new Error(error)),
          () => {
            expect(spyNext.called).to.be.true;
            done();
          }
        );
    });
  });

  describe('when execute a query with a single response row', () => {
    it('should return an Observable with one element', (done) => {

      const poolMock = {
        getPool: () => Rx.Observable.of({
          query: (query,params) => Promise.resolve([{key:1},{}])
        })
      };

      const mysqlConnection = new MysqlConnection({pool$: poolMock});
      const spyNext = sinon.spy();

      mysqlConnection.execute({
        query: 'SELECT * FROM PRODUCTS',
        params: [{},{}]
      })
        .subscribe(
          (data) => {
            expect(data).to.deep.equals({key:1});
            spyNext();
          },
          (error) => done(new Error(error)),
          () => {
            expect(spyNext.called).to.be.true;
            done();
          }
        );
    });
  });


  describe('when execute a beginTransaction', () => {
    it('should return an Observable with the connection', (done) => {

      const poolMock = {
        getPool: () => Rx.Observable.of({
          getConnection: () => Promise.resolve({
            connection:2,
            beginTransaction: () => Promise.resolve([{key:1},{}])
          })
        }),
      };

      const mysqlConnection = new MysqlConnection({pool$: poolMock});
      const spyNext = sinon.spy();

      mysqlConnection.beginTransaction()
        .subscribe(
          (data) => {
            expect(data.connection).to.equals(2);
            spyNext();
          },
          (error) => done(new Error(error)),
          () => {
            expect(spyNext.called).to.be.true;
            done();
          }
        );
    });
  });

});
