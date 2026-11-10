import { expect } from 'chai';
import { electronArgs } from '../../../../openMarket/infrastructure/configuration/webpack/devArgs';

describe('Dev server arguments', () => {
  it('forwards only the fixture reset flag', () => {
    expect(electronArgs(['--start-hot', '--reset-fixtures', '--other'])).to.deep.equal(['--reset-fixtures']);
    expect(electronArgs(undefined)).to.deep.equal([]);
    expect(electronArgs(['--reset-fixtures', '--reset-fixtures'])).to.deep.equal(['--reset-fixtures', '--reset-fixtures']);
  });
});
