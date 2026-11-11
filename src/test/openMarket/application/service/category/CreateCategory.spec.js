import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/operator/do';
import CreateCategory from '../../../../../openMarket/application/service/category/CreateCategory';
import CategoryCreated from '../../../../../openMarket/domain/event/CategoryCreated';

function bus() {
  const saved = [];
  return {
    saved,
    raised: 0,
    discarded: 0,
    save(event) {
      saved.push(event);
    },
    raise() {
      this.raised += 1;
    },
    discard() {
      this.discarded += 1;
    }
  };
}

describe('CreateCategory', () => {
  const transaction = {run(work) { return work(); }};

  it('saves a CategoryCreated event when the category is stored', done => {
    const events = bus();
    const useCase = new CreateCategory({
      repository: {
        save() {
          return Rx.Observable.of(null);
        }
      },
      categoryFactory: {createWith: () => ({id: 'cat-1', name: 'Fruta'})},
      domainEventBus: events,
      transaction
    });
    useCase.createCategory({name: 'Fruta'}).subscribe(
      () => {
        expect(events.saved).to.have.length(1);
        expect(events.saved[0]).to.be.instanceof(CategoryCreated);
        expect(events.saved[0].id).to.equal('cat-1');
        expect(events.saved[0].name).to.equal('Fruta');
        expect(events.raised).to.equal(1);
        expect(events.discarded).to.equal(0);
        done();
      },
      error => done(error)
    );
  });

  it('does not save an event when the category is not stored', done => {
    const events = bus();
    const useCase = new CreateCategory({
      repository: {
        save() {
          return Rx.Observable.throw(new Error('disk'));
        }
      },
      categoryFactory: {createWith: () => ({id: 'cat-1', name: 'Fruta'})},
      domainEventBus: events,
      transaction
    });
    useCase.createCategory({name: 'Fruta'}).subscribe(
      () => done(new Error('stored')),
      () => {
        expect(events.saved).to.deep.equal([]);
        expect(events.raised).to.equal(0);
        expect(events.discarded).to.equal(1);
        done();
      }
    );
  });
});
