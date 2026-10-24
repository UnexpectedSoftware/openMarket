import {mount} from '../components/mount';
import React from 'react';
import {expect} from 'chai';
import RouterHarness from '../components/routerHarness';
import CategoryCard from '../../../../openMarket/user_interface/category/CategoryCard';

const noop = () => {};

function card(category, extra) {
  return mount(
    <RouterHarness>
      <CategoryCard
        category={category}
        onEdit={noop}
        onDelete={noop}
        onOpenProduct={noop}
        {...extra}
      />
    </RouterHarness>
  );
}

describe('CategoryCard', () => {
  it('renders the four facts, Editar, and the placeholder when there is no photo', () => {
    const view = card({
      id: '1',
      name: 'Lácteos',
      imageUrl: null,
      productCount: 1,
      stockTotal: 4,
      basePriceCents: 150,
      mostSold: {barcode: '840', name: 'Leche', quantity: 3}
    });
    const text = view.node.textContent;
    expect(text).to.include('Lácteos');
    expect(text).to.include('Productos');
    expect(text).to.include('1');
    expect(text).to.include('Valor');
    expect(text).to.include('1,50');
    expect(text).to.include('Stock');
    expect(text).to.include('4');
    expect(text).to.include('Más vendido');
    expect(text).to.include('Leche');
    expect(text).to.include('Editar');
    expect(view.node.querySelector('[title="Suma de precios de coste"]')).to.not.equal(null);
    expect(view.node.querySelector('img').getAttribute('src')).to.include('category-placeholder.svg');
    expect(view.node.querySelector('[aria-label="Eliminar categoría"]')).to.equal(null);
    const products = view.node.querySelector('a.om-button');
    expect(products.textContent).to.include('Ver productos');
    expect(products.getAttribute('href')).to.equal('#/list_products?category=1');
    view.unmount();
  });

  it('shows Eliminar categoría only for an empty category and opens the most sold product', () => {
    let opened = null;
    const view = card({
      id: '2',
      name: 'Vacía',
      imageUrl: 'data:image/png,abc',
      productCount: 0,
      stockTotal: 0,
      basePriceCents: 0,
      mostSold: null
    }, {
      onOpenProduct: barcode => { opened = barcode; }
    });
    expect(view.node.textContent).to.include('—');
    expect(view.node.textContent).to.include('Ver productos');
    expect(view.node.querySelector('a.om-button').getAttribute('href')).to.equal('#/list_products?category=2');
    expect(view.node.querySelector('img').getAttribute('src')).to.equal('data:image/png,abc');
    const remove = view.node.querySelector('[aria-label="Eliminar categoría"]');
    expect(remove.textContent).to.include('Eliminar');
    view.unmount();

    let barcode = null;
    const sold = card({
      id: '3',
      name: 'Stock',
      imageUrl: null,
      productCount: 2,
      stockTotal: 1,
      basePriceCents: 0,
      mostSold: {barcode: '840', name: 'Leche', quantity: 1}
    }, {
      onOpenProduct: value => { barcode = value; }
    });
    sold.node.querySelector('.category-card-most-sold').click();
    expect(barcode).to.equal('840');
    expect(opened).to.equal(null);
    sold.unmount();
  });
});
