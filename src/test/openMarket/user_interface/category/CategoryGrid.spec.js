import {mount} from '../components/mount';
import React from 'react';
import {expect} from 'chai';
import CategoryGrid from '../../../../openMarket/user_interface/category/CategoryGrid';

describe('CategoryGrid', () => {
  it('renders the empty node it is given', () => {
    const view = mount(
      <CategoryGrid
        items={[]}
        empty={<span>Nada</span>}
        onEdit={() => {}}
        onDelete={() => {}}
        onOpenProduct={() => {}}
      />
    );
    expect(view.node.textContent).to.include('Nada');
    expect(view.node.querySelector('.category-grid')).to.equal(null);
    view.unmount();
  });
});
