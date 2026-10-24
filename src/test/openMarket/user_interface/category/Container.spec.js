import {mount} from '../components/mount';
import React from 'react';
import {expect} from 'chai';
import Container from '../../../../openMarket/user_interface/category/Container';

function render(page, spies) {
  const calls = spies || {};
  const props = {
    categoriesPage: {
      text: '',
      items: [],
      total: 0,
      loading: false,
      error: '',
      dialog: null,
      ...page
    },
    categoriesPageLoaded: calls.loaded || (() => {}),
    categoriesQueryChanged: calls.query || (() => {}),
    categoriesDialogOpened: calls.open || (() => {}),
    categoriesDialogClosed: calls.close || (() => {}),
    categoriesDraftChanged: calls.draft || (() => {}),
    categoriesSave: calls.save || (() => {}),
    categoriesDelete: calls.remove || (() => {}),
    listProductsDetail: calls.detail || (() => {})
  };
  return mount(<Container {...props} />);
}

const item = {
  id: 'a',
  name: 'Alpha',
  imageUrl: 'data:image/png,abc',
  productCount: 0,
  stockTotal: 0,
  basePriceCents: 0,
  mostSold: null
};

describe('categories Container', () => {
  it('shows skeletons, the empty state, a search miss, and a failure', () => {
    const loading = render({loading: true});
    expect(loading.node.querySelector('.category-skeleton')).to.not.equal(null);
    loading.unmount();

    const empty = render({});
    expect(empty.node.textContent).to.include('Aún no hay categorías');
    expect(empty.node.textContent).to.include('Crea la primera categoría para agrupar los productos.');
    empty.unmount();

    const missed = render({text: 'zzz'});
    expect(missed.node.textContent).to.include('Ninguna categoría coincide con la búsqueda');
    missed.unmount();

    const failed = render({error: 'db down'});
    expect(failed.node.textContent).to.include('db down');
    expect(failed.node.textContent).to.include('Reintentar');
    failed.unmount();
  });

  it('renders the cards and makes the header button secondary while the dialog is open', () => {
    const view = render({
      items: [item],
      total: 1,
      dialog: {
        mode: 'edit',
        id: 'a',
        name: 'Alpha',
        imageUrl: item.imageUrl,
        imagePath: null,
        clearImage: false,
        nameError: null,
        fileError: null,
        error: 'No se encuentra la categoría',
        saving: false
      }
    });
    expect(view.node.textContent).to.include('Alpha');
    expect(view.node.textContent).to.include('Editar categoría');
    expect(view.node.textContent).to.include('No se encuentra la categoría');
    expect(view.node.textContent).to.include('Usar imagen por defecto');
    const header = view.node.querySelector('.om-page-header button');
    expect(header.className).to.include('om-button--secondary');
    view.unmount();
  });

  it('dispatches search, dialog, delete, and retry', () => {
    const calls = {query: [], open: [], remove: [], loaded: 0, save: 0, draft: [], close: 0};
    const view = render({items: [item], total: 1, text: 'Al'}, {
      query: value => calls.query.push(value),
      open: value => calls.open.push(value),
      remove: id => calls.remove.push(id),
      loaded: () => { calls.loaded += 1; },
      save: () => { calls.save += 1; },
      draft: patch => calls.draft.push(patch),
      close: () => { calls.close += 1; }
    });
    const search = view.node.querySelector('#categories-search');
    search.value = 'pan';
    search.dispatchEvent(new window.Event('input', {bubbles: true}));
    // React 15 reads the value from the change event's target.
    const change = new window.Event('change', {bubbles: true});
    search.dispatchEvent(change);

    view.node.querySelector('.om-page-header button').click();
    view.node.querySelector('.category-card-actions button').click();

    const previous = window.confirm;
    window.confirm = () => false;
    view.node.querySelector('[aria-label="Eliminar categoría"]').click();
    window.confirm = () => true;
    view.node.querySelector('[aria-label="Eliminar categoría"]').click();
    window.confirm = previous;

    view.unmount();

    const missed = render({text: 'zzz'}, {query: value => calls.query.push(value)});
    missed.node.querySelector('.om-empty button').click();
    missed.unmount();

    const failed = render({error: 'db down'}, {loaded: () => { calls.loaded += 1; }});
    const retry = Array.prototype.find.call(
      failed.node.querySelectorAll('button'),
      button => button.textContent.indexOf('Reintentar') !== -1
    );
    retry.click();
    failed.unmount();

    expect(calls.open[0]).to.deep.equal({mode: 'create'});
    expect(calls.open[1]).to.deep.equal({mode: 'edit', id: 'a'});
    expect(calls.remove).to.deep.equal(['a']);
    expect(calls.query).to.include('');
    expect(calls.loaded).to.be.at.least(1);
  });

  it('saves from the name field and clears a photo back to the placeholder', () => {
    const calls = {save: 0, draft: [], close: 0};
    const view = render({
      dialog: {
        mode: 'edit',
        id: 'a',
        name: 'Alpha',
        imageUrl: 'data:image/png,abc',
        imagePath: null,
        clearImage: false,
        nameError: 'Obligatorio',
        fileError: null,
        error: null,
        saving: false
      }
    }, {
      save: () => { calls.save += 1; },
      draft: patch => calls.draft.push(patch),
      close: () => { calls.close += 1; }
    });
    const name = view.node.querySelector('#category-name');
    name.dispatchEvent(new window.KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
    name.dispatchEvent(new window.KeyboardEvent('keydown', {key: 'a', bubbles: true}));
    const clear = Array.prototype.find.call(
      view.node.querySelectorAll('button'),
      button => button.textContent.indexOf('Usar imagen por defecto') !== -1
    );
    clear.click();
    const cancel = Array.prototype.find.call(
      view.node.querySelectorAll('button'),
      button => button.textContent.indexOf('Cancelar') !== -1
    );
    cancel.click();
    view.unmount();
    expect(calls.save).to.equal(1);
    expect(calls.close).to.equal(1);
    expect(calls.draft[0].clearImage).to.equal(true);
    expect(calls.draft[0].imageUrl).to.equal(null);
  });

  it('blocks a dropped file from navigating the window', () => {
    const view = render({});
    const ignored = new window.Event('dragover', {bubbles: true, cancelable: true});
    window.dispatchEvent(ignored);
    expect(ignored.defaultPrevented).to.equal(false);
    const dropped = new window.Event('dragover', {bubbles: true, cancelable: true});
    dropped.dataTransfer = {types: ['Files']};
    window.dispatchEvent(dropped);
    expect(dropped.defaultPrevented).to.equal(true);
    view.unmount();
  });
});
