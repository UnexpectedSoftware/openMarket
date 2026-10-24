import {expect} from 'chai';
import {
  archiveDismissed,
  archivePrompted,
  archiveStarted,
  catalogRequest,
  catalogRoute,
  categoriesLoaded,
  categoryFromQuery,
  categoryParam,
  detailLoaded,
  draftChanged,
  draftErrors,
  draftFromDetail,
  drawerClosed,
  drawerFailed,
  drawerOpened,
  emptyDraft,
  filtersActive,
  filtersChanged,
  imageFound,
  imageMissed,
  imageRequested,
  locationWithoutCategory,
  lowStockParam,
  pageChanged,
  pageOpened,
  productArchived,
  productDisabled,
  productSaved,
  productsFailed,
  productsLoaded,
  queryChanged,
  saveCommand,
  saveFailed,
  saveRequested,
  showingLabel,
  state,
  syncedCategory
} from '../../../../../openMarket/user_interface/product/list_products/model';

const page = {offset: 0, limit: 20, total: 0};

describe('products list model', () => {
  it('labels the current page, the last page, and an empty catalog', () => {
    expect(showingLabel({offset: 20, limit: 20, total: 50})).to.equal('Mostrando 21–40 de 50');
    expect(showingLabel({offset: 40, limit: 20, total: 50})).to.equal('Mostrando 41–50 de 50');
    expect(showingLabel({offset: 0, limit: 20, total: 5})).to.equal('Mostrando 1–5 de 5');
    expect(showingLabel(page)).to.equal('Mostrando 0–0 de 0');
  });

  it('treats text, chips, weight, stock, and category as active filters', () => {
    expect(filtersActive(state())).to.equal(false);
    expect(filtersActive({query: '  '})).to.equal(false);
    expect(filtersActive({query: 'leche'})).to.equal(true);
    expect(filtersActive({lowStock: true})).to.equal(true);
    expect(filtersActive({status: 'ENABLED'})).to.equal(true);
    expect(filtersActive({categoryId: 'dairy'})).to.equal(true);
    expect(filtersActive({weighted: true})).to.equal(true);
  });

  it('opens a page, changes the query, and moves the offset', () => {
    const opened = pageOpened(state(), {lowStock: true, query: 'pan'});
    expect(opened.loading).to.equal(true);
    expect(opened.lowStock).to.equal(true);
    expect(opened.items).to.deep.equal([]);
    const typed = queryChanged({...opened, offset: 20, items: [{barcode: '1'}]}, 'le');
    expect(typed.query).to.equal('le');
    expect(typed.offset).to.equal(0);
    const filtered = filtersChanged(typed, {
      lowStock: false,
      status: 'DISABLED',
      categoryId: 'bakery',
      weighted: true,
      sort: 'stock_desc'
    });
    expect(filtered.status).to.equal('DISABLED');
    expect(filtered.weighted).to.equal(true);
    expect(filtered.sort).to.equal('stock_desc');
    expect(pageChanged(filtered, {offset: 40}).offset).to.equal(40);
  });

  it('stores a matching page and ignores a stale one', () => {
    const current = {...state(), query: 'leche', offset: 0};
    const stale = productsLoaded(current, {
      query: 'le',
      items: [{barcode: '1'}],
      total: 1
    });
    expect(stale).to.equal(current);
    const loaded = productsLoaded(current, {
      query: 'leche',
      lowStock: false,
      status: null,
      categoryId: null,
      weighted: null,
      sort: 'name_asc',
      offset: 0,
      items: [{barcode: '1', name: 'Leche'}],
      total: 4
    });
    expect(loaded.items).to.deep.equal([{barcode: '1', name: 'Leche'}]);
    expect(loaded.total).to.equal(4);
    expect(loaded.loading).to.equal(false);
    expect(loaded.error).to.equal('');
  });

  it('keeps the error for the page that failed and disables one row', () => {
    const current = {...state(), status: 'ENABLED'};
    expect(productsFailed(current, {query: 'no', message: 'db'}).error).to.equal('');
    const failed = productsFailed(current, {
      query: '',
      status: 'ENABLED',
      message: 'db'
    });
    expect(failed.loading).to.equal(false);
    expect(failed.error).to.equal('db');
    const disabled = productDisabled({
      ...state(),
      items: [{barcode: '1', status: 'ENABLED'}, {barcode: '2', status: 'ENABLED'}]
    }, '1');
    expect(disabled.items.map(item => item.status)).to.deep.equal(['DISABLED', 'ENABLED']);
    const listed = categoriesLoaded(state(), [{id: 'a', name: 'Fruta'}]);
    expect(listed.categories).to.have.length(1);
    expect(listed.categoriesLoaded).to.equal(true);
    expect(categoriesLoaded(state(), null).categories).to.deep.equal([]);
    expect(state().categoriesLoaded).to.equal(false);
  });

  it('applies a category query id and ignores an unknown one', () => {
    const categories = [{id: 'dairy', name: 'Lácteos'}];
    expect(categoryFromQuery(categories, 'dairy', true)).to.equal('dairy');
    expect(categoryFromQuery(categories, 'missing', true)).to.equal(null);
    expect(categoryFromQuery(categories, '', true)).to.equal(null);
    expect(categoryFromQuery(categories, null, true)).to.equal(null);
    expect(categoryFromQuery([], 'dairy', false)).to.equal('dairy');
    expect(categoryFromQuery([], 'dairy', true)).to.equal(null);
    expect(categoryParam(null)).to.equal(null);
    expect(lowStockParam(null)).to.equal(false);

    const pending = {categories: [], categoriesLoaded: false};
    expect(catalogRequest({query: {category: 'dairy', lowStock: '1'}}, pending)).to.include({
      lowStock: true,
      categoryId: 'dairy',
      query: ''
    });
    const known = {categories, categoriesLoaded: true};
    expect(catalogRequest({query: {category: 'dairy'}}, known).categoryId).to.equal('dairy');
    expect(catalogRequest({query: {category: 'missing'}}, known).categoryId).to.equal(null);
  });

  it('drops category from the route and keeps low stock', () => {
    expect(catalogRoute({lowStock: true, categoryId: 'dairy'})).to.deep.equal({
      lowStock: '1',
      category: 'dairy'
    });
    expect(catalogRoute({lowStock: true, categoryId: null})).to.deep.equal({lowStock: '1'});
    expect(catalogRoute({lowStock: false})).to.deep.equal({});
    expect(catalogRoute(null)).to.deep.equal({});
    expect(locationWithoutCategory({query: {lowStock: '1', category: 'dairy'}})).to.deep.equal({
      query: {lowStock: '1'}
    });
    expect(locationWithoutCategory({query: {category: 'dairy'}})).to.deep.equal({query: {}});
  });

  it('syncs a loaded category and leaves an early query alone', () => {
    const waiting = {
      location: {query: {}},
      products: {categoryId: null, categories: [], categoriesLoaded: false}
    };
    const asked = {
      location: {query: {category: 'dairy'}},
      products: {categoryId: null, categories: [], categoriesLoaded: false}
    };
    expect(syncedCategory(waiting, asked)).to.equal(undefined);
    expect(syncedCategory(waiting, waiting)).to.equal(undefined);

    const optimistic = {
      location: {query: {category: 'missing'}},
      products: {categoryId: 'missing', categories: [], categoriesLoaded: false}
    };
    const unknown = {
      location: {query: {category: 'missing'}},
      products: {categoryId: 'missing', categories: [{id: 'dairy'}], categoriesLoaded: true}
    };
    expect(syncedCategory(optimistic, unknown)).to.equal(null);

    const matched = {
      location: {query: {category: 'dairy'}},
      products: {categoryId: 'dairy', categories: [{id: 'dairy'}], categoriesLoaded: true}
    };
    const beforeMatch = {
      location: {query: {category: 'dairy'}},
      products: {categoryId: 'dairy', categories: [], categoriesLoaded: false}
    };
    expect(syncedCategory(beforeMatch, matched)).to.equal(undefined);

    const cleared = {
      location: {query: {lowStock: '1'}},
      products: matched.products
    };
    expect(syncedCategory(matched, cleared)).to.equal(null);

    const revealed = {
      location: {query: {category: 'dairy'}},
      products: {categoryId: null, categories: [{id: 'dairy'}], categoriesLoaded: true}
    };
    expect(syncedCategory(asked, revealed)).to.equal('dairy');

    const sameCategories = [{id: 'dairy'}];
    expect(syncedCategory(
      {
        location: {query: {}},
        products: {categoryId: 'dairy', categories: sameCategories, categoriesLoaded: false}
      },
      {
        location: {query: {}},
        products: {categoryId: 'dairy', categories: sameCategories, categoriesLoaded: true}
      }
    )).to.equal(null);
    expect(catalogRequest(null, null).categoryId).to.equal(null);
  });

  it('keeps a drawer the navigation just opened', () => {
    const editing = drawerOpened(state(), {mode: 'edit', barcode: '0002'});
    const reopened = pageOpened(editing, {query: ''});
    expect(reopened.drawerOpen).to.equal(true);
    expect(reopened.mode).to.equal('edit');
    expect(reopened.editingBarcode).to.equal('0002');
    expect(reopened.loadingDraft).to.equal(true);
    expect(reopened.loading).to.equal(true);
  });

  it('locks the barcode on edit and follows the margin', () => {
    const editing = {
      ...drawerOpened(state(), {mode: 'edit', barcode: '0002'}),
      loadingDraft: false,
      draft: draftFromDetail({
        barcode: '0002',
        name: 'Ham',
        priceCents: 185,
        basePriceCents: 115,
        status: 'ENABLED',
        vat: {kind: 'S1', percent: 21, cause: null}
      })
    };
    expect(editing.draft.marginPercent).to.equal(38);
    expect(editing.draft.price).to.equal(1.85);
    const locked = draftChanged(editing, {field: 'barcode', value: '9999'});
    expect(locked).to.equal(editing);
    const priced = draftChanged(editing, {field: 'price', value: 1.2});
    const cost = draftChanged(priced, {field: 'basePrice', value: 0.7});
    expect(cost.draft.barcode).to.equal('0002');
    expect(cost.draft.marginPercent).to.equal(42);
    expect(cost.draft.marginPercent).to.not.equal(null);
    const free = draftChanged(cost, {field: 'price', value: 0});
    expect(free.draft.marginPercent).to.equal(null);
  });

  it('does not save when the draft fails validation', () => {
    const creating = drawerOpened(state(), {mode: 'create'});
    expect(creating.draft.vatRate).to.equal('S1:21');
    expect(creating.draft.active).to.equal(true);
    const rejected = saveRequested(creating);
    expect(rejected.saving).to.equal(false);
    expect(rejected.errors.name).to.equal('Obligatorio');
    expect(rejected.errors.barcode).to.equal('Obligatorio');
    expect(rejected.errors.price).to.equal('Obligatorio');
    expect(rejected.errors.stock).to.equal('Obligatorio');
    expect(rejected.errors.stockMin).to.equal('Obligatorio');
    expect(rejected.errors.categoryId).to.equal('Obligatorio');
    const filled = {
      ...creating,
      draft: {
        ...emptyDraft(),
        barcode: '1234567890123456',
        name: 'Milk',
        price: -1,
        basePrice: 0,
        stock: -2,
        stockMin: 0,
        categoryId: 'dairy',
        vatRate: 'nope'
      }
    };
    const invalid = saveRequested(filled);
    expect(invalid.saving).to.equal(false);
    expect(invalid.errors.barcode).to.equal('15 caracteres como máximo');
    expect(invalid.errors.price).to.equal('Debe ser mayor que 0');
    expect(invalid.errors.basePrice).to.equal('Debe ser mayor que 0');
    expect(invalid.errors.stock).to.equal('Debe ser 0 o mayor');
    expect(invalid.errors.stockMin).to.equal('Debe ser mayor que 0');
    expect(invalid.errors.vatRate).to.equal('Elige un IVA');
    const ready = saveRequested({
      ...creating,
      draft: {
        ...emptyDraft(),
        barcode: '1001',
        name: 'Milk',
        price: 2,
        basePrice: 1,
        stock: 0,
        stockMin: 1,
        categoryId: 'dairy',
        active: false
      }
    });
    expect(ready.saving).to.equal(true);
    expect(ready.errors).to.deep.equal({});
    expect(saveCommand(ready.draft, null).status).to.equal('DISABLED');
    expect(saveCommand(ready.draft, '/tmp/milk.jpg').imagePath).to.equal('/tmp/milk.jpg');
    expect(saveCommand(ready.draft, null).imagePath).to.equal(undefined);
  });

  it('archives by disabling the row and closing the drawer', () => {
    const open = drawerOpened({
      ...state(),
      items: [{barcode: '1001', status: 'ENABLED'}]
    }, {mode: 'edit', barcode: '1001'});
    const archived = productArchived(open, '1001');
    expect(archived.drawerOpen).to.equal(false);
    expect(archived.confirmArchive).to.equal(false);
    expect(archived.items[0].status).to.equal('DISABLED');
    expect(archivePrompted(open).confirmArchive).to.equal(true);
    const creating = drawerOpened(state(), {mode: 'create'});
    const idle = state();
    expect(archivePrompted(creating)).to.equal(creating);
    expect(archivePrompted(idle)).to.equal(idle);
    const prompted = archivePrompted(open);
    expect(archiveDismissed(prompted).confirmArchive).to.equal(false);
    expect(archiveStarted(prompted).saving).to.equal(true);
    expect(archiveStarted(prompted).confirmArchive).to.equal(false);
  });

  it('fills an edit draft from the detail and ignores a stale load', () => {
    const blank = draftFromDetail(null);
    expect(blank.barcode).to.equal('');
    expect(blank.name).to.equal('');
    expect(blank.description).to.equal('');
    expect(blank.vatRate).to.equal('S1:21');
    expect(blank.active).to.equal(true);
    expect(blank.price).to.equal('');
    const disabled = draftFromDetail({
      barcode: null,
      name: null,
      description: null,
      priceCents: 1e21,
      basePriceCents: 50,
      vat: 4,
      stock: null,
      stockMin: null,
      weighted: 1,
      status: 'DISABLED',
      imageUrl: ''
    });
    expect(disabled.active).to.equal(false);
    expect(disabled.vatRate).to.equal('S1:21');
    expect(disabled.marginPercent).to.equal(null);
    expect(disabled.stock).to.equal('');
    expect(disabled.imageUrl).to.equal(null);
    const kept = draftFromDetail({
      barcode: 1001,
      name: 'Milk',
      description: 'Cold',
      categoryId: 'dairy',
      priceCents: 200,
      basePriceCents: 100,
      vat: {kind: 'S1', percent: 10, cause: null},
      stock: 0,
      stockMin: 1,
      status: 'ENABLED',
      imageUrl: 'data:milk'
    });
    expect(kept.barcode).to.equal('1001');
    expect(kept.vatRate).to.equal('S1:10');
    expect(kept.imageUrl).to.equal('data:milk');
    expect(kept.price).to.equal(2);

    const editing = drawerOpened(state(), {mode: 'edit', barcode: '1001'});
    const creating = drawerOpened(state(), {mode: 'create'});
    const idle = state();
    expect(detailLoaded(idle, {barcode: '1001', draft: kept})).to.equal(idle);
    expect(detailLoaded(creating, {barcode: '1001', draft: kept})).to.equal(creating);
    expect(detailLoaded(editing, {barcode: '9999', draft: kept})).to.equal(editing);
    expect(detailLoaded(editing, null)).to.equal(editing);
    const loaded = detailLoaded(editing, {barcode: '1001'});
    expect(loaded.loadingDraft).to.equal(false);
    expect(loaded.draft.barcode).to.equal('');
    expect(detailLoaded(editing, {barcode: '1001', draft: kept}).draft.name).to.equal('Milk');
  });

  it('keeps a failed open and a failed save on the matching drawer', () => {
    const idle = state();
    const editing = drawerOpened(state(), {mode: 'edit', barcode: '1001'});
    expect(drawerFailed(idle, {barcode: '1001', message: 'no'})).to.equal(idle);
    expect(drawerFailed(editing, {barcode: 'other', message: 'no'})).to.equal(editing);
    expect(drawerFailed(editing, null)).to.equal(editing);
    const failed = drawerFailed(editing, {barcode: '1001'});
    expect(failed.loadingDraft).to.equal(false);
    expect(failed.formError).to.equal('No se ha podido abrir el producto');
    expect(drawerFailed(editing, {barcode: '1001', message: 'cerrado'}).formError).to.equal('cerrado');
    const closed = drawerClosed(editing);
    expect(closed.drawerOpen).to.equal(false);
    expect(closed.editingBarcode).to.equal(null);

    const saving = {...editing, errors: {name: 'Obligatorio'}, saving: true};
    expect(saveFailed(saving, null).saving).to.equal(false);
    expect(saveFailed(saving, null).errors.name).to.equal('Obligatorio');
    expect(saveFailed(saving, {errors: {price: 'Debe ser mayor que 0'}}).errors.price).to.equal('Debe ser mayor que 0');
    expect(saveFailed({...editing, errors: null}, {message: 'roto'}).formError).to.equal('roto');
    expect(saveFailed({...editing, errors: null}, {message: 'roto'}).errors).to.deep.equal({});
    const saved = productSaved(editing);
    expect(saved.drawerOpen).to.equal(false);
    expect(saved.loading).to.equal(true);
  });

  it('looks up an image only while creating and ignores a closed drawer', () => {
    const idle = state();
    const creating = drawerOpened(state(), {mode: 'create'});
    const editing = drawerOpened(state(), {mode: 'edit', barcode: '1'});
    expect(imageRequested(editing)).to.equal(editing);
    expect(imageRequested(idle)).to.equal(idle);
    expect(imageRequested(creating).imageLookupBusy).to.equal(true);
    expect(imageFound(editing, {imagePath: '/tmp/a', imageUrl: 'data:a'})).to.equal(editing);
    expect(imageFound(idle, {imagePath: '/tmp/a'})).to.equal(idle);
    const found = imageFound({...creating, draft: null}, null);
    expect(found.imageLookupBusy).to.equal(false);
    expect(found.draft.imagePath).to.equal(null);
    expect(found.draft.imageUrl).to.equal(null);
    const pictured = imageFound(creating, {imagePath: '/tmp/a.jpg', imageUrl: 'data:a'});
    expect(pictured.draft.imagePath).to.equal('/tmp/a.jpg');
    expect(pictured.draft.imageUrl).to.equal('data:a');
    expect(imageMissed(idle, 'no')).to.equal(idle);
    expect(imageMissed(creating).formError).to.equal('No se ha encontrado una imagen para este código');
    expect(imageMissed(creating, 'red').formError).to.equal('red');
  });

  it('rejects a draft field that is not on the form and a price that is not money', () => {
    const creating = {
      ...drawerOpened(state(), {mode: 'create'}),
      errors: {name: 'Obligatorio'},
      formError: 'antes'
    };
    const idle = state();
    expect(draftChanged(idle, {field: 'name', value: 'Milk'})).to.equal(idle);
    expect(draftChanged(creating, null)).to.equal(creating);
    expect(draftChanged(creating, {field: 'marginPercent', value: 10})).to.equal(creating);
    const named = draftChanged(creating, {field: 'name', value: 'Milk'});
    expect(named.draft.name).to.equal('Milk');
    expect(named.errors.name).to.equal(undefined);
    expect(named.formError).to.equal('');
    const huge = draftChanged(named, {field: 'price', value: 1e21});
    expect(huge.draft.marginPercent).to.equal(null);
    const infinite = draftChanged(named, {field: 'price', value: Infinity});
    expect(infinite.draft.marginPercent).to.equal(null);
    const text = draftChanged(named, {field: 'basePrice', value: '1,20'});
    expect(text.draft.marginPercent).to.equal(null);
    const weighed = draftChanged(named, {field: 'weighted', value: true});
    expect(weighed.draft.weighted).to.equal(true);
    expect(draftErrors({
      name: '  ',
      barcode: '  ',
      price: '1,5',
      basePrice: 'no',
      stock: true,
      stockMin: '  ',
      categoryId: null,
      vatRate: ''
    }, 'create').price).to.equal(undefined);
    expect(draftErrors({
      name: 'Milk',
      barcode: '1001',
      price: 'abc',
      basePrice: NaN,
      stock: '1,5',
      stockMin: '2',
      categoryId: 'dairy',
      vatRate: 'S1:10'
    }, 'edit').barcode).to.equal(undefined);
    expect(draftErrors({
      name: 'Milk',
      barcode: '1001',
      price: 'abc',
      basePrice: NaN,
      stock: '1,5',
      stockMin: '2',
      categoryId: 'dairy',
      vatRate: 'S1:10'
    }, 'edit').price).to.equal('Debe ser un número');
    expect(draftErrors({
      name: 'Milk',
      barcode: '1001',
      price: '1,5',
      basePrice: 1,
      stock: '1,5',
      stockMin: '2',
      categoryId: 'dairy',
      vatRate: 'S1:10'
    }, 'create').stock).to.equal(undefined);
    expect(saveCommand(null, '').barcode).to.equal('');
    expect(saveCommand({...emptyDraft(), description: null, active: true}, undefined).description).to.equal('');
    expect(saveCommand({...emptyDraft(), name: ' Milk ', barcode: ' 1001 '}, undefined).name).to.equal('Milk');
  });

  it('uses the catalog defaults when a page action arrives empty', () => {
    expect(showingLabel(null)).to.equal('Mostrando 0–0 de 0');
    expect(filtersActive(null)).to.equal(false);
    expect(filtersActive({weighted: false})).to.equal(false);
    const opened = pageOpened(state(), null);
    expect(opened.query).to.equal('');
    expect(opened.weighted).to.equal(null);
    expect(queryChanged(state(), null).query).to.equal('');
    const cleared = filtersChanged(state(), null);
    expect(cleared.sort).to.equal('name_asc');
    expect(cleared.weighted).to.equal(null);
    expect(filtersChanged(state(), {weighted: false}).weighted).to.equal(false);
    expect(pageChanged(state(), null).offset).to.equal(0);
    expect(pageChanged(state(), {offset: -4}).offset).to.equal(0);
    expect(productsFailed(state(), null).error).to.equal('No se han podido cargar los productos');
    expect(productsLoaded(state(), {items: null, total: 'no'}).items).to.deep.equal([]);
    expect(categoriesLoaded(state(), null).categories).to.deep.equal([]);
    expect(productDisabled({}, '1').items).to.deep.equal([]);
    expect(drawerOpened(state(), null).mode).to.equal('create');
    expect(drawerOpened(state(), {mode: 'edit'}).editingBarcode).to.equal('');
    const mismatched = productsLoaded({...state(), weighted: true}, {weighted: false, items: [{barcode: '1'}], total: 1});
    expect(mismatched.weighted).to.equal(true);
    expect(productsLoaded({...state(), weighted: false}, {weighted: null, items: [], total: 0}).items).to.deep.equal([]);
  });
});
