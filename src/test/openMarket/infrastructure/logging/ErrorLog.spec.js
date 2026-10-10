import {expect} from 'chai';
import ProductNotFoundError from '../../../../openMarket/domain/product/ProductNotFoundError';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';
import {record, resetForTest, start} from '../../../../openMarket/infrastructure/logging/ErrorLog';

describe('ErrorLog', () => {
  const lines = [];

  beforeEach(() => {
    lines.length = 0;
    start({write: line => lines.push(line)});
  });

  afterEach(() => {
    resetForTest();
  });

  it('writes one JSON line for a product miss and its cause', () => {
    const cause = new Error('SQLITE_CONSTRAINT');
    cause.name = 'SqliteError';
    const error = new ProductNotFoundError({
      barcode: '8412',
      name: 'Milk',
      operation: 'updateImage',
      cause
    });

    record(error);
    record(error);

    expect(lines).to.have.length(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.code).to.equal(ErrorCode.PRODUCT_NOT_FOUND);
    expect(parsed.level).to.equal('warn');
    expect(parsed.name).to.equal('ProductNotFoundError');
    expect(parsed.message).to.equal('Product 8412 Milk was not found while updating its image');
    expect(parsed.context).to.deep.equal({
      barcode: '8412',
      name: 'Milk',
      operation: 'updateImage'
    });
    expect(parsed.cause).to.have.length(1);
    expect(parsed.cause[0].name).to.equal('SqliteError');
    expect(parsed.cause[0].message).to.equal('SQLITE_CONSTRAINT');
    expect(parsed.stack).to.be.a('string');
    expect(parsed.process).to.equal('main');
    expect(parsed.version).to.equal(null);
  });

  it('records a plain error as UNEXPECTED', () => {
    record(new Error('disk full'));
    const parsed = JSON.parse(lines[0]);
    expect(parsed.code).to.equal(ErrorCode.UNEXPECTED);
    expect(parsed.level).to.equal('error');
    expect(parsed.message).to.equal('disk full');
    expect(parsed.cause).to.deep.equal([]);
  });
});
