import {expect} from 'chai';
import CategoryCreated from '../../../../openMarket/domain/event/CategoryCreated';
import {hydrate} from '../../../../openMarket/domain/event/registry';

describe('CategoryCreated', () => {
  it('stores the category id and name and can be rebuilt from the bus', () => {
    expect(CategoryCreated.type).to.equal('CategoryCreated');
    expect(CategoryCreated.durable).to.equal(true);
    const event = new CategoryCreated({id: 'cat-1', name: 'Fruta'});
    expect(event.id).to.equal('cat-1');
    expect(event.name).to.equal('Fruta');
    const rebuilt = hydrate('CategoryCreated', {id: 'cat-1', name: 'Fruta'});
    expect(rebuilt).to.be.instanceof(CategoryCreated);
    expect(rebuilt.id).to.equal('cat-1');
    expect(rebuilt.name).to.equal('Fruta');
  });
});
