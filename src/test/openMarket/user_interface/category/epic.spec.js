import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toArray';
import CategoriesQuery from '../../../../openMarket/domain/category/CategoriesQuery';
import CategoryNotFoundError from '../../../../openMarket/domain/category/CategoryNotFoundError';
import {
  CATEGORIES_DELETE,
  CATEGORIES_FAILED,
  CATEGORIES_LOADED,
  CATEGORIES_PAGE_LOADED,
  CATEGORIES_QUERY_CHANGED,
  CATEGORIES_SAVE,
  CATEGORIES_SAVE_FAILED,
  CATEGORIES_SAVED
} from '../../../../openMarket/user_interface/category/action';
import {
  makeCategoriesListEpic,
  makeCategoryDeleteEpic,
  makeCategorySaveEpic
} from '../../../../openMarket/user_interface/category/epicFactory';
import {NOT_FOUND} from '../../../../openMarket/user_interface/category/model';

function row(name, extra) {
  return {
    id: name,
    name,
    imageUrl: null,
    productCount: 0,
    stockTotal: 0,
    basePriceCents: 0,
    mostSold: null,
    ...extra
  };
}

function storeOf(page) {
  return {getState: () => ({categoriesPage: page})};
}

function collect(epic, action, page) {
  return epic(Rx.Observable.of(action), storeOf(page)).toArray();
}

describe('makeCategoriesListEpic', () => {
  it('reads the page with a CategoriesQuery and copies the view fields', done => {
    const page = {text: ' leche ', items: []};
    let criteria = null;
    const listCategories = {
      list: query => {
        criteria = query;
        return Rx.Observable.of({
          items: [
            row('Pan'),
            row('Leche', {
              imageUrl: 'data:image/png,x',
              productCount: 1,
              stockTotal: 4,
              basePriceCents: 150,
              mostSold: {barcode: '1', name: 'Leche', quantity: 3}
            })
          ],
          total: 2
        });
      }
    };
    collect(makeCategoriesListEpic(listCategories), {type: CATEGORIES_PAGE_LOADED}, page)
      .subscribe(
        actions => {
          expect(criteria).to.be.instanceof(CategoriesQuery);
          expect(criteria.text).to.equal('leche');
          expect(actions.map(action => action.type)).to.deep.equal([CATEGORIES_LOADED]);
          expect(actions[0].total).to.equal(2);
          expect(actions[0].items[0].mostSold).to.equal(null);
          expect(actions[0].items[1].imageUrl).to.equal('data:image/png,x');
          expect(actions[0].items[1].basePriceCents).to.equal(150);
          expect(actions[0].items[1].mostSold).to.deep.equal({barcode: '1', name: 'Leche', quantity: 3});
          done();
        },
        error => done(error)
      );
  });

  it('cancels the previous search when a newer one arrives', () => {
    const first = new Rx.Subject();
    let calls = 0;
    const seen = [];
    let page = {text: 'one'};
    const listCategories = {
      list: query => {
        calls += 1;
        seen.push(query);
        if (calls === 1) {
          return first;
        }
        return Rx.Observable.of({items: [row('Second')], total: 1});
      }
    };
    const actions = new Rx.Subject();
    const received = [];
    const subscription = makeCategoriesListEpic(listCategories)(actions, {
      getState: () => ({categoriesPage: page})
    }).subscribe(action => received.push(action));
    actions.next({type: CATEGORIES_PAGE_LOADED});
    page = {text: 'two'};
    actions.next({type: CATEGORIES_PAGE_LOADED});
    expect(received.map(action => action.type)).to.deep.equal([CATEGORIES_LOADED]);
    expect(received[0].items[0].name).to.equal('Second');
    expect(seen[0]).to.be.instanceof(CategoriesQuery);
    expect(seen[0].text).to.equal('one');
    expect(seen[1].text).to.equal('two');
    first.next({items: [row('First')], total: 1});
    first.complete();
    expect(received).to.have.length(1);
    subscription.unsubscribe();
  });

  it('reports a failure as CATEGORIES_FAILED', done => {
    const listCategories = {list: () => Rx.Observable.throw(new Error('db down'))};
    collect(makeCategoriesListEpic(listCategories), {type: CATEGORIES_PAGE_LOADED}, {text: ''})
      .subscribe(
        actions => {
          expect(actions.map(action => action.type)).to.deep.equal([CATEGORIES_FAILED]);
          expect(actions[0].message).to.equal('db down');
          done();
        },
        error => done(error)
      );
  });

  it('waits 300 ms before searching', done => {
    let calls = 0;
    const listCategories = {
      list: () => {
        calls += 1;
        return Rx.Observable.of({items: [], total: 0});
      }
    };
    const actions = new Rx.Subject();
    const subscription = makeCategoriesListEpic(listCategories)(actions, storeOf({text: 'leche'}))
      .subscribe();
    actions.next({type: CATEGORIES_QUERY_CHANGED, text: 'leche'});
    expect(calls).to.equal(0);
    setTimeout(() => {
      try {
        expect(calls).to.equal(1);
        subscription.unsubscribe();
        done();
      } catch (error) {
        done(error);
      }
    }, 400);
  });
});

describe('makeCategorySaveEpic', () => {
  const unused = {
    updateCategory: () => { throw new Error('update'); },
    replaceImage: () => { throw new Error('replace'); },
    removeImage: () => { throw new Error('remove'); }
  };

  it('creates with the trimmed name and the image path', done => {
    let command = null;
    const createCategory = {
      createCategory: value => {
        command = value;
        return Rx.Observable.of(null);
      }
    };
    const page = {
      items: [],
      dialog: {mode: 'create', name: '  Pan  ', imagePath: '/tmp/a.png', fileError: null}
    };
    collect(makeCategorySaveEpic(createCategory, unused), {type: CATEGORIES_SAVE}, page)
      .subscribe(
        actions => {
          expect(command).to.deep.equal({name: 'Pan', imagePath: '/tmp/a.png'});
          expect(actions.map(action => action.type)).to.include(CATEGORIES_SAVED);
          expect(actions.map(action => action.type)).to.include(CATEGORIES_PAGE_LOADED);
          expect(actions.map(action => action.title)).to.include('Categoría guardada');
          done();
        },
        error => done(error)
      );
  });

  it('skips updateCategory when the edit name is unchanged', done => {
    const calls = [];
    const updateCategory = {
      updateCategory: () => { throw new Error('update'); },
      replaceImage: value => {
        calls.push(value);
        return Rx.Observable.of(null);
      },
      removeImage: () => { throw new Error('remove'); }
    };
    const page = {
      items: [{id: '1', name: 'Pan'}],
      dialog: {
        mode: 'edit',
        id: '1',
        name: 'Pan',
        imagePath: '/tmp/b.png',
        clearImage: false,
        fileError: null
      }
    };
    collect(makeCategorySaveEpic({createCategory: () => { throw new Error('create'); }}, updateCategory), {type: CATEGORIES_SAVE}, page)
      .subscribe(
        actions => {
          expect(calls).to.deep.equal([{id: '1', imagePath: '/tmp/b.png'}]);
          expect(actions.map(action => action.title)).to.include('Cambios aplicados');
          expect(actions.map(action => action.title)).to.not.include('Categoría guardada');
          done();
        },
        error => done(error)
      );
  });

  it('renames, and clears the photo only when asked', done => {
    const renamed = [];
    const cleared = [];
    const updateCategory = {
      updateCategory: value => {
        renamed.push(value);
        return Rx.Observable.of(null);
      },
      replaceImage: () => { throw new Error('replace'); },
      removeImage: value => {
        cleared.push(value);
        return Rx.Observable.of(null);
      }
    };
    const renamedPage = {
      items: [{id: '1', name: 'Pan'}],
      dialog: {mode: 'edit', id: '1', name: 'Panadería', imagePath: null, clearImage: true, fileError: null}
    };
    collect(makeCategorySaveEpic({}, updateCategory), {type: CATEGORIES_SAVE}, renamedPage)
      .subscribe(
        () => {
          expect(renamed).to.deep.equal([{id: '1', name: 'Panadería'}]);
          expect(cleared).to.deep.equal([{id: '1'}]);
          done();
        },
        error => done(error)
      );
  });

  it('turns CategoryNotFoundError into the dialog error and not a success toast', done => {
    const updateCategory = {
      updateCategory: () => Rx.Observable.throw(new CategoryNotFoundError({id: '1', operation: 'rename'})),
      replaceImage: () => Rx.Observable.of(null),
      removeImage: () => Rx.Observable.of(null)
    };
    const page = {
      items: [{id: '1', name: 'Pan'}],
      dialog: {mode: 'edit', id: '1', name: 'Otro', imagePath: null, clearImage: false, fileError: null}
    };
    collect(makeCategorySaveEpic({}, updateCategory), {type: CATEGORIES_SAVE}, page)
      .subscribe(
        actions => {
          expect(actions.map(action => action.type)).to.deep.equal([CATEGORIES_SAVE_FAILED]);
          expect(actions[0].message).to.equal(NOT_FOUND);
          expect(actions.map(action => action.title)).to.not.include('Cambios aplicados');
          done();
        },
        error => done(error)
      );
  });

  it('keeps a generic failure on the dialog', done => {
    const createCategory = {createCategory: () => Rx.Observable.throw(new Error('disk full'))};
    const page = {
      items: [],
      dialog: {mode: 'create', name: 'Pan', imagePath: null, fileError: null}
    };
    collect(makeCategorySaveEpic(createCategory, unused), {type: CATEGORIES_SAVE}, page)
      .subscribe(
        actions => {
          expect(actions.map(action => action.type)).to.deep.equal([CATEGORIES_SAVE_FAILED]);
          expect(actions[0].message).to.equal('disk full');
          done();
        },
        error => done(error)
      );
  });

  it('does not call the use case for a blank name or a rejected file', done => {
    let calls = 0;
    const createCategory = {
      createCategory: () => {
        calls += 1;
        return Rx.Observable.of(null);
      }
    };
    const epic = makeCategorySaveEpic(createCategory, unused);
    const blank = {items: [], dialog: {mode: 'create', name: '   ', imagePath: null, fileError: null}};
    const rejected = {items: [], dialog: {mode: 'create', name: 'Pan', imagePath: null, fileError: 'tipo'}};
    const missing = {items: [], dialog: null};
    collect(epic, {type: CATEGORIES_SAVE}, blank).subscribe(blankActions => {
      collect(epic, {type: CATEGORIES_SAVE}, rejected).subscribe(rejectedActions => {
        collect(epic, {type: CATEGORIES_SAVE}, missing).subscribe(missingActions => {
          expect(blankActions).to.deep.equal([]);
          expect(rejectedActions).to.deep.equal([]);
          expect(missingActions).to.deep.equal([]);
          expect(calls).to.equal(0);
          done();
        }, error => done(error));
      }, error => done(error));
    }, error => done(error));
  });

  it('still confirms an edit that did not change the name or the photo', done => {
    const updateCategory = {
      updateCategory: () => { throw new Error('update'); },
      replaceImage: () => { throw new Error('replace'); },
      removeImage: () => { throw new Error('remove'); }
    };
    const page = {
      items: [{id: '1', name: 'Pan'}],
      dialog: {mode: 'edit', id: '1', name: 'Pan', imagePath: null, clearImage: false, fileError: null}
    };
    collect(makeCategorySaveEpic({}, updateCategory), {type: CATEGORIES_SAVE}, page)
      .subscribe(
        actions => {
          expect(actions.map(action => action.title)).to.include('Cambios aplicados');
          done();
        },
        error => done(error)
      );
  });
});

describe('makeCategoryDeleteEpic', () => {
  it('reloads and toasts after a delete', done => {
    let command = null;
    const deleteCategory = {
      deleteCategory: value => {
        command = value;
        return Rx.Observable.of(null);
      }
    };
    makeCategoryDeleteEpic(deleteCategory)(Rx.Observable.of({type: CATEGORIES_DELETE, id: 'a'}))
      .toArray()
      .subscribe(
        actions => {
          expect(command).to.deep.equal({id: 'a'});
          expect(actions.map(action => action.type)).to.include(CATEGORIES_PAGE_LOADED);
          expect(actions.map(action => action.title)).to.include('Categoría eliminada');
          done();
        },
        error => done(error)
      );
  });

  it('toasts a delete failure', done => {
    const deleteCategory = {deleteCategory: () => Rx.Observable.throw(new Error('locked'))};
    makeCategoryDeleteEpic(deleteCategory)(Rx.Observable.of({type: CATEGORIES_DELETE, id: 'a'}))
      .toArray()
      .subscribe(
        actions => {
          expect(actions.map(action => action.title)).to.deep.equal(['No se ha podido eliminar la categoría']);
          expect(actions[0].message).to.equal('locked');
          done();
        },
        error => done(error)
      );
  });
});
