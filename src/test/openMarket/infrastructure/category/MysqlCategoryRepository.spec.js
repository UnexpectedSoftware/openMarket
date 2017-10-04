import { expect } from 'chai';
import * as Rx from "rxjs";
import sinon from 'sinon';
import CategoryFactoryImpl from "../../../../openMarket/infrastructure/category/CategoryFactoryImpl";
import UUIDIdentity from "../../../../openMarket/infrastructure/service/UUIDIdentity";
import MysqlCategoryRepository from "../../../../openMarket/infrastructure/category/MysqlCategoryRepository";

const categoryFactory = new CategoryFactoryImpl({identity: new UUIDIdentity()});

describe('Mysql Category Repository', () => {
  describe('when save category', () => {
    it('should return an Observable with one element of domain category', (done) => {

      const givenCategoryName = "Odin";

      const connectionMock = {
        execute: () => Rx.Observable.of({insertId: 42})
      };

      const mysqlCategoryRepository = new MysqlCategoryRepository({
        connection: connectionMock,
        categoryFactory: categoryFactory
      });

      const spyNext = sinon.spy();

      const expectedCategory = categoryFactory.createWithId({
        id: 42,
        name: givenCategoryName
      });

      mysqlCategoryRepository.save({
        name: givenCategoryName
      })
      .subscribe(
        (category) => {
          expect(category).to.deep.equals(expectedCategory);
          spyNext();
        },
        (error) => done(new Error(error)),
        () => {
          expect(spyNext.called).to.be.true
          done();
        })
    });
  });


  describe('when update a category', () => {
    it('should return an Observable that emits one null element', (done) => {

      const givenCategoryName = "Odin";
      const givenCategoryId = 42;

      const connectionMock = {
        execute: () => Rx.Observable.of({})
      };

      const mysqlCategoryRepository = new MysqlCategoryRepository({
        connection: connectionMock,
        categoryFactory: categoryFactory
      });

      const spyNext = sinon.spy();

      mysqlCategoryRepository.update({
        id: 42,
        name: givenCategoryName
      })
        .subscribe(
          (category) => {
            expect(category).to.be.null;
            spyNext();
          },
          (error) => done(new Error(error)),
          () => {
            expect(spyNext.called).to.be.true
            done();
          })
    });
  });

  describe('when findAll category', () => {
    it('should return an Observable with all domain categories', (done) => {

      const connectionMock = {
        execute: () => Rx.Observable.of({id:42,name:'Odin'},{id:1,name:'Thor'})
      };

      const mysqlCategoryRepository = new MysqlCategoryRepository({
        connection: connectionMock,
        categoryFactory: categoryFactory
      });

      const spyNext = sinon.spy();

      const expectedCategoryOne = categoryFactory.createWithId({
        id: 42,
        name: 'Odin'
      });
      const expectedCategoryTwo = categoryFactory.createWithId({
        id: 1,
        name: 'Thor'
      });

      mysqlCategoryRepository.findAll()
        .subscribe(
          (categories) => {
            expect(categories[0]).to.deep.equals(expectedCategoryOne);
            expect(categories[1]).to.deep.equals(expectedCategoryTwo);
            spyNext();
          },
          (error) => done(new Error(error)),
          () => {
            expect(spyNext.called).to.be.true
            done();
          })
    });
  });

  describe('when findById category', () => {
    it('should return an Observable of domain category', (done) => {

      const givenId = 42

      const connectionMock = {
        execute: () => Rx.Observable.of({id:42,name:'Odin'})
      };

      const mysqlCategoryRepository = new MysqlCategoryRepository({
        connection: connectionMock,
        categoryFactory: categoryFactory
      });

      const spyNext = sinon.spy();

      const expectedCategory = categoryFactory.createWithId({
        id: 42,
        name: 'Odin'
      });

      mysqlCategoryRepository.findById({id: 42})
        .subscribe(
          (category) => {
            expect(category).to.deep.equals(expectedCategory);
            spyNext();
          },
          (error) => done(new Error(error)),
          () => {
            expect(spyNext.called).to.be.true
            done();
          })
    });
  });

  describe('when findById category with nonexistent id', () => {
    it('should return an Observable that complete without elements', (done) => {

      const givenId = 'notfound'

      const connectionMock = {
        execute: () => Rx.Observable.empty()
      };

      const mysqlCategoryRepository = new MysqlCategoryRepository({
        connection: connectionMock,
        categoryFactory: categoryFactory
      });

      const spyNext = sinon.spy();

      mysqlCategoryRepository.findById({id: givenId})
        .subscribe(
          (category) => {
            spyNext();
          },
          (error) => done(new Error(error)),
          () => {
            expect(spyNext.called).to.be.false
            done();
          })
    });
  });



});
