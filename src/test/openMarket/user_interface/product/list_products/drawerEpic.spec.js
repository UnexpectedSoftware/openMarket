import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/toArray';
import ProductNotFoundError from '../../../../../openMarket/domain/product/ProductNotFoundError';
import ErrorCode from '../../../../../openMarket/domain/error/ErrorCode';
import {
  LIST_PRODUCTS_FETCH,
  PRODUCTS_ARCHIVE,
  PRODUCTS_ARCHIVED,
  PRODUCTS_DETAIL_LOADED,
  PRODUCTS_DRAWER_CLOSED,
  PRODUCTS_DRAWER_FAILED,
  PRODUCTS_DRAWER_OPENED,
  PRODUCTS_IMAGE_FOUND,
  PRODUCTS_IMAGE_MISSED,
  PRODUCTS_IMAGE_REQUESTED,
  PRODUCTS_SAVE,
  PRODUCTS_SAVED,
  PRODUCTS_SAVE_FAILED
} from '../../../../../openMarket/user_interface/product/list_products/action';
import {
  makeArchiveEpic,
  makeDetailEpic,
  makeImageEpic,
  makeReleaseImageEpic,
  makeSavedEpic,
  makeSaveEpic
} from '../../../../../openMarket/user_interface/product/list_products/drawerEpic';
import {forgetFetched, rememberFetched} from '../../../../../openMarket/user_interface/product/list_products/lookupTemp';
import {drawerOpened, emptyDraft} from '../../../../../openMarket/user_interface/product/list_products/model';

function tempPhoto(name) {
  const file = path.join(os.tmpdir(), name);
  fs.writeFileSync(file, 'photo');
  return file;
}

function pageOf(mode, draft) {
  const opened = drawerOpened({}, mode === 'edit' ? {mode: 'edit', barcode: '1001'} : {mode: 'create'});
  return {...opened, draft: draft || validDraft(), loadingDraft: false};
}

function run(epic, action, store) {
  return epic(Rx.Observable.of(action), store).toArray();
}

function validDraft() {
  return {
    ...emptyDraft(),
    barcode: '1001',
    name: 'Milk',
    price: 2,
    basePrice: 1,
    stock: 10,
    stockMin: 2,
    categoryId: 'dairy',
    active: true
  };
}

describe('product drawer epics', () => {
  afterEach(() => {
    forgetFetched();
  });
  it('maps a typed save error to PRODUCTS_SAVE_FAILED', done => {
    const failure = new ProductNotFoundError({barcode: '1001', operation: 'disable'});
    let command = null;
    const createOrUpdate = {
      createOrUpdate(value) {
        command = value;
        return Rx.Observable.throw(failure);
      }
    };
    const page = {...drawerOpened({draft: validDraft()}, {mode: 'edit', barcode: '1001'}), draft: validDraft(), loadingDraft: false};
    makeSaveEpic(createOrUpdate)(
      Rx.Observable.of({type: PRODUCTS_SAVE, payload: {imagePath: '/tmp/milk.jpg'}}),
      {getState: () => ({listProducts: page})}
    ).toArray().subscribe(
      actions => {
        expect(command.imagePath).to.equal('/tmp/milk.jpg');
        expect(command.status).to.equal('ENABLED');
        expect(command.price).to.equal(2);
        expect(actions.map(action => action.type)).to.deep.equal([PRODUCTS_SAVE_FAILED]);
        expect(actions[0].payload.code).to.equal(ErrorCode.PRODUCT_NOT_FOUND);
        expect(actions[0].payload.message).to.equal('product not found');
      },
      error => done(error),
      () => done()
    );
  });

  it('does not save when validation fails', done => {
    let calls = 0;
    const createOrUpdate = {
      createOrUpdate() {
        calls += 1;
        return Rx.Observable.of(null);
      }
    };
    const page = drawerOpened({}, {mode: 'create'});
    makeSaveEpic(createOrUpdate)(
      Rx.Observable.of({type: PRODUCTS_SAVE, payload: {}}),
      {getState: () => ({listProducts: page})}
    ).toArray().subscribe(
      actions => {
        expect(calls).to.equal(0);
        expect(actions.map(action => action.type)).to.deep.equal([PRODUCTS_SAVE_FAILED]);
        expect(actions[0].payload.errors.name).to.equal('Obligatorio');
      },
      error => done(error),
      () => done()
    );
  });

  it('calls disable and does not call enableForSale', done => {
    const calls = [];
    const disableProduct = {
      disable({barcode}) {
        calls.push(['disable', barcode]);
        return Rx.Observable.of(null);
      },
      enableForSale({barcode}) {
        calls.push(['enable', barcode]);
        return Rx.Observable.of(null);
      }
    };
    makeArchiveEpic(disableProduct)(Rx.Observable.of({
      type: PRODUCTS_ARCHIVE,
      payload: {barcode: '1001'}
    })).toArray().subscribe(
      actions => {
        expect(calls).to.deep.equal([['disable', '1001']]);
        expect(actions[0].type).to.equal(PRODUCTS_ARCHIVED);
        expect(actions[0].payload).to.equal('1001');
        expect(actions[1].title).to.equal('Producto desactivado');
      },
      error => done(error),
      () => done()
    );
  });

  it('emits PRODUCTS_SAVED when the use case completes', done => {
    const createOrUpdate = {createOrUpdate: () => Rx.Observable.of(null)};
    const page = {...drawerOpened({}, {mode: 'create'}), draft: validDraft()};
    makeSaveEpic(createOrUpdate)(
      Rx.Observable.of({type: PRODUCTS_SAVE, payload: {}}),
      {getState: () => ({listProducts: page})}
    ).toArray().subscribe(
      actions => {
        expect(actions.map(action => action.type)).to.deep.equal([PRODUCTS_SAVED]);
      },
      error => done(error),
      () => done()
    );
  });

  it('maps an empty save to a missing category and ignores a store without a page', done => {
    const createOrUpdate = {createOrUpdate: () => Rx.Observable.empty()};
    const page = pageOf('create');
    makeSaveEpic(createOrUpdate)(
      Rx.Observable.of({type: PRODUCTS_SAVE, payload: {}}),
      {getState: () => ({listProducts: page})}
    ).toArray().subscribe(actions => {
      expect(actions[0].payload.errors.categoryId).to.equal('Obligatorio');
      makeSaveEpic(createOrUpdate)(
        Rx.Observable.of({type: PRODUCTS_SAVE}),
        null
      ).toArray().subscribe(missed => {
        expect(missed[0].type).to.equal(PRODUCTS_SAVE_FAILED);
        makeSaveEpic(createOrUpdate)(
          Rx.Observable.of({type: PRODUCTS_SAVE}),
          {getState: () => ({})}
        ).toArray().subscribe(
          emptyPage => {
            expect(emptyPage[0].payload.errors.name).to.equal('Obligatorio');
          },
          error => done(error),
          () => done()
        );
      });
    });
  });

  it('loads a detail, reports a miss, and ignores create', done => {
    let barcode = null;
    const list = {
      detail(query) {
        barcode = query.barcode;
        return Rx.Observable.of({
          barcode: '1001',
          name: 'Milk',
          priceCents: 200,
          basePriceCents: 100,
          status: 'ENABLED'
        });
      }
    };
    makeDetailEpic(list)(Rx.Observable.of(
      {type: PRODUCTS_DRAWER_OPENED, payload: {mode: 'edit', barcode: '1001'}},
      {type: PRODUCTS_DRAWER_OPENED, payload: {mode: 'create'}},
      {type: PRODUCTS_DRAWER_OPENED}
    )).toArray().subscribe(actions => {
      expect(barcode).to.equal('1001');
      expect(actions.map(action => action.type)).to.deep.equal([PRODUCTS_DETAIL_LOADED]);
      expect(actions[0].payload.draft.name).to.equal('Milk');
      expect(actions[0].payload.draft.price).to.equal(2);
      makeDetailEpic({detail: () => Rx.Observable.empty()})(
        Rx.Observable.of({type: PRODUCTS_DRAWER_OPENED, payload: {mode: 'edit', barcode: '404'}})
      ).toArray().subscribe(missing => {
        expect(missing[0].type).to.equal(PRODUCTS_DRAWER_FAILED);
        expect(missing[0].payload.message).to.equal('No se ha encontrado el producto');
        makeDetailEpic({detail: () => Rx.Observable.throw(new Error('db'))})(
          Rx.Observable.of({type: PRODUCTS_DRAWER_OPENED, payload: {mode: 'edit', barcode: '1'}})
        ).toArray().subscribe(
          failed => {
            expect(failed[0].payload.message).to.equal('db');
          },
          error => done(error),
          () => done()
        );
      });
    });
  });

  it('looks up an image on create and drops it when the drawer has closed', done => {
    const photo = tempPhoto('openfoodfacts-found.jpg');
    const late = tempPhoto('openfoodfacts-late.jpg');
    let open = true;
    const store = {
      getState: () => ({listProducts: open ? pageOf('create') : {...pageOf('create'), drawerOpen: false}})
    };
    makeImageEpic({
      findByBarcode: () => Rx.Observable.of({imagePath: photo, imageUrl: 'data:milk'})
    })(
      Rx.Observable.of({type: 'OTHER'}, {type: PRODUCTS_IMAGE_REQUESTED}),
      store
    ).toArray().subscribe(actions => {
      expect(actions[0].type).to.equal(PRODUCTS_IMAGE_FOUND);
      expect(actions[0].payload.imageUrl).to.equal('data:milk');
      expect(fs.existsSync(photo)).to.equal(true);
      makeImageEpic({
        findByBarcode: () => {
          open = false;
          return Rx.Observable.of({imagePath: late, imageUrl: 'data:late'});
        }
      })(Rx.Observable.of({type: PRODUCTS_IMAGE_REQUESTED}), store).toArray().subscribe(closed => {
        expect(closed[0].type).to.equal(PRODUCTS_IMAGE_MISSED);
        expect(closed[0].payload).to.equal('');
        expect(fs.existsSync(late)).to.equal(false);
        done();
      }, error => done(error));
    }, error => done(error));
  });

  it('reports a missing barcode, a miss, and a lookup error', done => {
    const blank = pageOf('create', {...emptyDraft(), barcode: '  '});
    makeImageEpic({findByBarcode: () => Rx.Observable.of(null)})(
      Rx.Observable.of({type: PRODUCTS_IMAGE_REQUESTED}),
      {getState: () => ({listProducts: blank})}
    ).toArray().subscribe(missingBarcode => {
      expect(missingBarcode[0].payload.errors.barcode).to.equal('Obligatorio');
      const editing = pageOf('edit');
      makeImageEpic({findByBarcode: () => Rx.Observable.of(null)})(
        Rx.Observable.of({type: PRODUCTS_IMAGE_REQUESTED}),
        {getState: () => ({listProducts: editing})}
      ).toArray().subscribe(ignored => {
        expect(ignored).to.deep.equal([]);
        makeImageEpic({findByBarcode: () => Rx.Observable.of(null)})(
          Rx.Observable.of({type: PRODUCTS_IMAGE_REQUESTED}),
          {getState: () => ({listProducts: {...pageOf('create'), drawerOpen: false}})}
        ).toArray().subscribe(closed => {
          expect(closed).to.deep.equal([]);
          makeImageEpic({findByBarcode: () => Rx.Observable.of(null)})(
            Rx.Observable.of({type: PRODUCTS_IMAGE_REQUESTED}),
            {getState: () => ({listProducts: pageOf('create')})}
          ).toArray().subscribe(nothing => {
            expect(nothing[0].type).to.equal(PRODUCTS_IMAGE_MISSED);
            makeImageEpic({findByBarcode: () => Rx.Observable.of({imagePath: ''})})(
          Rx.Observable.of({type: PRODUCTS_IMAGE_REQUESTED}),
          {getState: () => ({listProducts: pageOf('create')})}
        ).toArray().subscribe(noPath => {
          expect(noPath[0].type).to.equal(PRODUCTS_IMAGE_MISSED);
          makeImageEpic({findByBarcode: () => Rx.Observable.empty()})(
            Rx.Observable.of({type: PRODUCTS_IMAGE_REQUESTED}),
            {getState: () => ({listProducts: pageOf('create')})}
          ).toArray().subscribe(empty => {
            expect(empty[0].type).to.equal(PRODUCTS_IMAGE_MISSED);
            expect(empty[0].payload).to.equal(undefined);
            makeImageEpic({findByBarcode: () => Rx.Observable.throw(new Error('off'))})(
              Rx.Observable.of({type: PRODUCTS_IMAGE_REQUESTED}),
              {getState: () => ({listProducts: pageOf('create')})}
            ).toArray().subscribe(failed => {
              expect(failed[0].payload).to.equal('off');
              makeImageEpic({
                findByBarcode: () => Rx.Observable.of({imagePath: tempPhoto('openfoodfacts-nourl.jpg')})
              })(
                Rx.Observable.of({type: PRODUCTS_IMAGE_REQUESTED}),
                {getState: () => ({listProducts: pageOf('create', {...validDraft(), draft: null})})}
              ).toArray().subscribe(
                noUrl => {
                  expect(noUrl[0].payload.imageUrl).to.equal(null);
                },
                error => done(error),
                () => done()
              );
            });
          });
        });
          });
        });
      });
    });
  });

  it('toasts a save and deletes the downloaded file when the drawer closes', done => {
    const file = tempPhoto('openfoodfacts-release.jpg');
    rememberFetched(file);
    makeSavedEpic()(Rx.Observable.of({type: PRODUCTS_SAVED})).toArray().subscribe(actions => {
      expect(actions[0].title).to.equal('Producto guardado');
      expect(actions[1].type).to.equal(LIST_PRODUCTS_FETCH);
      makeReleaseImageEpic()(Rx.Observable.of(
        {type: PRODUCTS_DRAWER_CLOSED},
        {type: PRODUCTS_SAVED},
        {type: 'OTHER'}
      )).toArray().subscribe(
        released => {
          expect(released).to.deep.equal([]);
          expect(fs.existsSync(file)).to.equal(false);
        },
        error => done(error),
        () => done()
      );
    }, error => done(error));
  });

  it('maps a failed archive to PRODUCTS_SAVE_FAILED', done => {
    makeArchiveEpic({
      disable: () => Rx.Observable.throw(new Error('locked')),
      enableForSale: () => Rx.Observable.of(null)
    })(Rx.Observable.of({type: PRODUCTS_ARCHIVE, payload: {barcode: '1001'}})).toArray().subscribe(
      actions => {
        expect(actions[0].type).to.equal(PRODUCTS_SAVE_FAILED);
        expect(actions[0].payload.message).to.equal('locked');
      },
      error => done(error),
      () => done()
    );
  });
});
