import { expect } from 'chai';
import * as Rx from "rxjs";
import sinon from 'sinon';
import ProductFactoryImpl from "../../../../openMarket/infrastructure/product/ProductFactoryImpl";
import CategoryFactoryImpl from "../../../../openMarket/infrastructure/category/CategoryFactoryImpl";
import MysqlProductRepository from "../../../../openMarket/infrastructure/product/MysqlProductRepository";
import ProductFilter from "../../../../openMarket/domain/product/ProductFilter";



const productFactory = new ProductFactoryImpl({});
const categoryFactory  = new CategoryFactoryImpl({});

describe('Mysql Product Repository', () => {
  describe('when save product', () => {
    it('should return an Observable with one element of null value', (done) => {

      const givenProduct = productFactory.createWith({
        id: 'test',
        barcode: '4242',
        name: 'Odin',
        description: 'Father of everyone!',
        price: 5.50,
        basePrice: 0.55,
        stock: 10,
        stockMin: 5,
        weighted: 0,
        category: categoryFactory.createWithId({id:42,name:'lala'}),
        status: 'ENABLED'
      });

      const connectionMock = {
        execute: () => Rx.Observable.of({},{})
      };


      const mysqlProductRepository = new MysqlProductRepository({
        connection: connectionMock,
        productMapper: {}
      });


      const spyNext = sinon.spy();

      mysqlProductRepository.save({product: givenProduct})
        .subscribe(
          (data) => {
            expect(data).to.be.null;
            spyNext();
          },
          (error) => done(new Error(error)),
          () => {
            expect(spyNext.called).to.be.true
            done();
          });


    });
  });

  describe('when findAll products', () => {
    it('should return an Observable with an Array of domain products', (done) => {

      const connectionMock = {
        execute: ({}) => Rx.Observable.of({},{})
      };

      const product = productFactory.createWith({
        id: 'test',
        barcode: '4242',
        name: '',
        description: '',
        price: 5.50,
        basePrice: 0.55,
        stock: 10,
        stockMin: 5,
        weighted: 0,
        category: categoryFactory.createWithId({id:42,name:'lala'}),
        status: 'ENABLED'
      });

      const productMapperMock = {
        toDomain: ({persistenceProduct}) => Rx.Observable.of(product)
      };

      const mysqlProductRepository = new MysqlProductRepository({
        connection: connectionMock,
        productMapper: productMapperMock
      });

      const spyNext = sinon.spy();

      mysqlProductRepository.findAll({productFilter:new ProductFilter()})
        .subscribe(
          (data) => {
            expect(data).to.have.lengthOf(2);
            expect(data[0]).to.deep.equals(product);
            expect(data[1]).to.deep.equals(product);
            spyNext()
          },
          (error) => done(new Error(error)),
          () => {
            expect(spyNext.called).to.be.true
            done();
          }
        );
    });
  });


  describe('when findAll products by name', () => {
    it('should return an Observable with an Array of domain products', (done) => {

      const connectionMock = {
        execute: () => Rx.Observable.of({},{})
      };

      const product = productFactory.createWith({
        id: 'test',
        barcode: '4242',
        name: 'FORLAYO',
        description: '',
        price: 5.50,
        basePrice: 0.55,
        stock: 10,
        stockMin: 5,
        weighted: 0,
        category: categoryFactory.createWithId({id:42,name:'lala'}),
        status: 'ENABLED'
      });

      const productMapperMock = {
        toDomain: ({persistenceProduct}) => Rx.Observable.of(product)
      };

      const mysqlProductRepository = new MysqlProductRepository({
        connection: connectionMock,
        productMapper: productMapperMock
      });

      const spyNext = sinon.spy();

      mysqlProductRepository.findAllByName({
        name: 'FORLAYO',
        limit: 42,
        offset: 0
      })
        .subscribe(
          (data) => {
            expect(data).to.have.lengthOf(2);
            expect(data[0]).to.deep.equals(product);
            expect(data[1]).to.deep.equals(product);
            spyNext()
          },
          (error) => done(new Error(error)),
          () => {
            expect(spyNext.called).to.be.true
            done();
          }
        );
    });
  });


  describe('when findAll products with low stock', () => {
    it('should return an Observable with an Array of domain products', (done) => {

      const connectionMock = {
        execute: () => Rx.Observable.of({},{})
      };

      const product = productFactory.createWith({
        id: 'test',
        barcode: '4242',
        name: 'FORLAYO',
        description: '',
        price: 5.50,
        basePrice: 0.55,
        stock: 1,
        stockMin: 5,
        weighted: 0,
        category: categoryFactory.createWithId({id:42,name:'lala'}),
        status: 'ENABLED'
      });

      const productMapperMock = {
        toDomain: ({persistenceProduct}) => Rx.Observable.of(product)
      };

      const mysqlProductRepository = new MysqlProductRepository({
        connection: connectionMock,
        productMapper: productMapperMock
      });

      const spyNext = sinon.spy();

      mysqlProductRepository.findAllWithLowStock({
        limit: 42,
        offset: 0
      })
        .subscribe(
          (data) => {
            expect(data).to.have.lengthOf(2);
            expect(data[0]).to.deep.equals(product);
            expect(data[1]).to.deep.equals(product);
            spyNext()
          },
          (error) => done(new Error(error)),
          () => {
            expect(spyNext.called).to.be.true
            done();
          }
        );
    });
  });



  describe('when find product with existent barcode', () => {
    it('should return an Observable of domain product', (done) => {

      const connectionMock = {
        execute: () => Rx.Observable.of({})
      };

      const product = productFactory.createWith({
        id: 'test',
        barcode: '4242',
        name: 'FORLAYO',
        description: '',
        price: 5.50,
        basePrice: 0.55,
        stock: 1,
        stockMin: 5,
        weighted: 0,
        category: categoryFactory.createWithId({id:42,name:'lala'}),
        status: 'ENABLED'
      });

      const productMapperMock = {
        toDomain: ({persistenceProduct}) => Rx.Observable.of(product)
      };

      const mysqlProductRepository = new MysqlProductRepository({
        connection: connectionMock,
        productMapper: productMapperMock
      });

      const spyNext = sinon.spy();

      mysqlProductRepository.findByBarcode({barcode: '4242'})
        .subscribe(
          (data) => {
            expect(data).to.deep.equals(product);
            spyNext()
          },
          (error) => done(new Error(error)),
          () => {
            expect(spyNext.called).to.be.true
            done();
          }
        );
    });
  });

  describe('when find product with unexistent barcode', () => {
    it('should return an Observable with no elements', (done) => {

      const connectionMock = {
        execute: () => Rx.Observable.empty()
      };

      const mysqlProductRepository = new MysqlProductRepository({
        connection: connectionMock,
        productMapper: {}
      });

      const spyError = sinon.spy();

      mysqlProductRepository.findByBarcode({barcode: 'notfound'})
        .do((data) => spyError(),error => spyError())
        .subscribe(
          (data) => expect(spyError.called).to.be.false,
          (error) => expect(spyError.called).to.be.false,
          () => {
            expect(spyError.called).to.be.false
            done();
          }
        );

    });
  });

  describe('when count products', () => {
    it('should return an Observable of number', (done) => {

      const connectionMock = {
        execute: () => Rx.Observable.of({total:100})
      };

      const mysqlProductRepository = new MysqlProductRepository({
        connection: connectionMock,
        productMapper: {}
      });

      const spyNext = sinon.spy();

      mysqlProductRepository.countProducts()
        .subscribe(
          (data) => {
            expect(data).to.be.equals(100);
            spyNext();
          },
          (error) => done(new Error(error)),
          () => {
            expect(spyNext.called).to.be.true
            done();
          }
        );
    });
  });

  describe('when count products by name', () => {
    it('should return an Observable of number', (done) => {

      const connectionMock = {
        execute: () => Rx.Observable.of({total:100})
      };

      const mysqlProductRepository = new MysqlProductRepository({
        connection: connectionMock,
        productMapper: {}
      });

      const spyNext = sinon.spy();

      mysqlProductRepository.countProductsByName({name:'FORLAYO'})
        .subscribe(
          (data) => {
            expect(data).to.be.equals(100);
            spyNext();
          },
          (error) => done(new Error(error)),
          () => {
            expect(spyNext.called).to.be.true
            done();
          }
        );
    });
  });

  describe('when count products with low stock', () => {
    it('should return an Observable of number', (done) => {

      const connectionMock = {
        execute: () => Rx.Observable.of({total:100})
      };

      const mysqlProductRepository = new MysqlProductRepository({
        connection: connectionMock,
        productMapper: {}
      });

      const spyNext = sinon.spy();

      mysqlProductRepository.countProductsWithLowStock()
        .subscribe(
          (data) => {
            expect(data).to.be.equals(100);
            spyNext();
          },
          (error) => done(new Error(error)),
          () => {
            expect(spyNext.called).to.be.true
            done();
          }
        );
    });
  });
});
