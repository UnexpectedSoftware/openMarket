import {mount} from '../../components/mount';
import React from 'react';
import {expect} from 'chai';
import ProductTable from '../../../../../openMarket/user_interface/product/list_products/ProductTable';

const noop = () => {};

function table(extra) {
  return mount(
    <ProductTable
      items={[]}
      total={0}
      offset={0}
      limit={20}
      loading={false}
      error=""
      onEdit={noop}
      onDisable={noop}
      onPage={noop}
      onRetry={noop}
      {...extra}
    />
  );
}

describe('ProductTable', () => {
  it('renders margin, Activo, and weighted stock', () => {
    const view = table({
      items: [{
        barcode: '1001',
        name: 'Manzana',
        categoryName: 'Fruta',
        priceCents: 120,
        basePriceCents: 70,
        marginPercent: 42,
        stock: 12.4,
        stockMin: 2,
        weighted: true,
        status: 'ENABLED',
        lowStock: true,
        imageUrl: null
      }],
      total: 1
    });
    const text = view.node.textContent;
    expect(text).to.include('42 %');
    expect(text).to.include('Activo');
    expect(text).to.include('12,4 kg');
    expect(text).to.include('bajo');
    expect(text).to.include('Mostrando 1–1 de 1');
    view.unmount();
  });

  it('renders the empty node it is given', () => {
    const view = table({empty: <span>Nada</span>});
    expect(view.node.textContent).to.include('Nada');
    view.unmount();
  });

  it('shows an em dash when the price has no margin', () => {
    const view = table({
      items: [{
        barcode: '0',
        name: 'Gratis',
        priceCents: 0,
        marginPercent: null,
        stock: 1,
        weighted: false,
        status: 'DISABLED',
        lowStock: false
      }],
      total: 1
    });
    expect(view.node.textContent).to.include('—');
    expect(view.node.textContent).to.include('Inactivo');
    expect(view.node.textContent).to.not.include('Desactivar');
    view.unmount();
  });
});
