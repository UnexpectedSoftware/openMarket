import {mount} from './mount';
import React from 'react';
import {expect} from 'chai';
import Spinner from '../../../../openMarket/user_interface/components/Spinner';
import Skeleton from '../../../../openMarket/user_interface/components/Skeleton';
import EmptyState from '../../../../openMarket/user_interface/components/EmptyState';
import Badge, {StatusPill} from '../../../../openMarket/user_interface/components/Badge';
import Card from '../../../../openMarket/user_interface/components/Card';
import {PageHeader, Toolbar} from '../../../../openMarket/user_interface/components/PageHeader';

describe('Spinner, Skeleton, EmptyState, Badge, Card, PageHeader', () => {
  it('announces the spinner and hides the skeleton', () => {
    const view = mount(<div><Spinner label="Loading products" /><Skeleton lines={2} width="40%" /></div>);
    expect(view.node.querySelector('.om-spinner').getAttribute('role')).to.equal('status');
    expect(view.node.querySelector('.om-visually-hidden').textContent).to.equal('Loading products');
    expect(view.node.querySelector('.om-skeleton').getAttribute('aria-hidden')).to.equal('true');
    expect(view.node.querySelectorAll('.om-skeleton-line')).to.have.length(2);
    view.unmount();
  });

  it('renders empty, badge, card, and page header text', () => {
    const view = mount(
      <div>
        <EmptyState icon="barcode" title="Aún no hay productos" message="Crea el primero." action={<button type="button">Crear producto</button>} />
        <Badge tone="warning">Low stock</Badge>
        <StatusPill tone="success">Activo</StatusPill>
        <Card title="Milk">Body</Card>
        <PageHeader title="Gallery" subtitle="Shared" />
        <Toolbar align="end"><span>End</span></Toolbar>
      </div>
    );
    expect(view.node.textContent).to.include('Aún no hay productos');
    expect(view.node.textContent).to.include('Low stock');
    expect(view.node.textContent).to.include('Activo');
    expect(view.node.querySelector('.om-card-title').textContent).to.equal('Milk');
    expect(view.node.querySelector('h1').textContent).to.equal('Gallery');
    expect(view.node.querySelector('.om-toolbar--end')).to.not.equal(null);
    view.unmount();
  });
});
