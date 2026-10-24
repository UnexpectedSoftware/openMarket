import React from 'react';
import {expect} from 'chai';
import {mount} from '../../components/mount';
import ProductDrawer from '../../../../../openMarket/user_interface/product/list_products/ProductDrawer';
import {emptyDraft} from '../../../../../openMarket/user_interface/product/list_products/model';

function render(extra) {
  const calls = {field: [], save: 0, close: 0, archive: 0, image: 0};
  const view = mount(
    <ProductDrawer
      open
      mode="create"
      draft={{...emptyDraft(), name: 'Milk', barcode: '1001', price: 1.2, basePrice: 0.7, marginPercent: 42}}
      errors={{name: 'Obligatorio'}}
      formError=""
      saving={false}
      loadingDraft={false}
      imageLookupBusy={false}
      categories={[{id: 'dairy', name: 'Lácteos'}]}
      nameRef={{current: null}}
      imageRef={() => {}}
      onField={(field, value) => calls.field.push([field, value])}
      onClose={() => { calls.close += 1; }}
      onSave={() => { calls.save += 1; }}
      onArchive={() => { calls.archive += 1; }}
      onFindImage={() => { calls.image += 1; }}
      {...extra}
    />
  );
  return {view, calls};
}

function click(node, selector) {
  const button = node.querySelector(selector);
  button.click();
}

describe('ProductDrawer', () => {
  it('creates a product and looks up an image', () => {
    const busy = render({formError: 'Revisa los campos', imageLookupBusy: true});
    expect(busy.view.node.textContent).to.contain('Buscando…');
    expect(busy.view.node.textContent).to.contain('Revisa los campos');
    busy.view.unmount();
    const {view, calls} = render();
    const node = view.node;
    expect(node.textContent).to.contain('Nuevo producto');
    expect(node.textContent).to.contain('Buscar imagen');
    expect(node.textContent).to.contain('Obligatorio');
    expect(node.textContent).to.contain('42 %');
    expect(node.textContent).to.contain('Lácteos');
    expect(node.querySelector('.products-drawer-delete')).to.equal(null);
    click(node, '.products-drawer-image button');
    expect(calls.image).to.equal(1);
    const save = Array.from(node.querySelectorAll('button')).find(button => button.textContent === 'Guardar');
    save.click();
    expect(calls.save).to.equal(1);
    const cancel = Array.from(node.querySelectorAll('button')).find(button => button.textContent === 'Cancelar');
    cancel.click();
    expect(calls.close).to.equal(1);
    node.querySelector('[role="switch"]').click();
    expect(calls.field[0]).to.deep.equal(['weighted', true]);
    node.querySelector('#product-name').value = 'Leche';
    node.querySelector('#product-name').dispatchEvent(new window.Event('input', {bubbles: true}));
    view.unmount();
  });

  it('edits a product with a locked barcode and no image lookup', () => {
    const {view, calls} = render({
      mode: 'edit',
      draft: {
        ...emptyDraft(),
        name: 'Ham',
        barcode: '0002',
        description: 'Sliced',
        categoryId: 'dairy',
        vatRate: 'S1:10',
        price: 1.85,
        basePrice: 1.15,
        stock: 4,
        stockMin: 1,
        active: true,
        imageUrl: 'data:ham',
        imagePath: '/tmp/ham.jpg'
      },
      errors: {}
    });
    const node = view.node;
    expect(node.textContent).to.contain('Editar producto');
    expect(node.textContent).not.to.contain('Buscar imagen');
    expect(node.querySelector('#product-barcode').readOnly).to.equal(true);
    click(node, '.products-drawer-delete');
    expect(calls.archive).to.equal(1);
    const active = Array.from(node.querySelectorAll('[role="switch"]')).find(button => button.textContent === 'Activo');
    expect(active.getAttribute('aria-checked')).to.equal('true');
    active.click();
    expect(calls.field[0]).to.deep.equal(['active', false]);
    view.unmount();
  });

  it('hides the fields while the detail is loading and survives a missing draft', () => {
    const loading = render({loadingDraft: true, draft: null, errors: null, categories: null});
    expect(loading.view.node.querySelector('#product-name')).to.equal(null);
    const save = Array.from(loading.view.node.querySelectorAll('button')).find(button => button.textContent === 'Guardar');
    expect(save.disabled).to.equal(true);
    loading.view.unmount();
    const bare = render({open: false, draft: null, errors: null, categories: null, formError: ''});
    expect(bare.view.node.textContent).to.equal('');
    bare.view.unmount();
  });
});