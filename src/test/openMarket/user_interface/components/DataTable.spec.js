import {mount} from './mount';
import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';
import {expect} from 'chai';
import DataTable from '../../../../openMarket/user_interface/components/DataTable';

const columns = [
  {key: 'name', header: 'Name', sortable: true},
  {key: 'stock', header: 'Stock', align: 'end', sortable: true}
];

describe('DataTable', () => {
  it('sets aria-sort and reports the next direction', () => {
    const sorts = [];
    const view = mount(
      <DataTable
        columns={columns}
        rows={[{id: '1', name: 'Milk', stock: 3}]}
        rowKey="id"
        sort={{key: 'name', dir: 'asc'}}
        onSort={sort => sorts.push(sort)}
      />
    );
    const headers = view.node.querySelectorAll('th');
    expect(headers[0].getAttribute('aria-sort')).to.equal('ascending');
    expect(headers[1].getAttribute('aria-sort')).to.equal('none');
    ReactTestUtils.Simulate.click(headers[0].querySelector('button'));
    expect(sorts).to.deep.equal([{key: 'name', dir: 'desc'}]);
    view.unmount();
  });

  it('shows the empty node and skeleton rows while loading', () => {
    const empty = mount(
      <DataTable columns={columns} rows={[]} rowKey="id" empty={<span>No rows</span>} />
    );
    expect(empty.node.textContent).to.include('No rows');
    empty.unmount();
    const loading = mount(<DataTable columns={columns} rows={[]} rowKey="id" loading />);
    expect(loading.node.querySelectorAll('tbody tr')).to.have.length(3);
    loading.unmount();
  });
});
