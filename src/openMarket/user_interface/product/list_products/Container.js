// @flow
import React, { Component } from 'react';
import { Link } from 'react-router';
import ReactTable from 'react-table';

class Container extends Component {

  constructor(props,context) {
    super(props, context);
    this.handlePageChanged = this.handlePageChanged.bind(this);
    this.columns = [{
      Header: 'Barcode',
      accessor: 'barcode',
      filterable: false
    },
      {
        Header: 'Name',
        accessor: 'name',
        filterMethod: (filter, row) => (row[filter.id].includes(filter.value))
      },
      {
        Header: 'Price',
        accessor: 'price',
        filterable: false
      },

      {
        Header: 'Stock',
        accessor: 'stock',
        filterable: false
      },
      {
        Header: 'Category',
        accessor: 'category.name',
        filterable: false
      },
      {
        Header: 'Status',
        accessor: 'status',
        filterable: false
      }
    ];
  }

  handlePageChanged (pageIndex) {
    const { listProductsPageChanged, products } = this.props;
    listProductsPageChanged({
      page: pageIndex,
      limit: products.filters.limit,
      offset: (pageIndex * products.filters.limit)
    });

  }

  componentWillMount() {
    const { listProductsPageLoaded, products } = this.props;
    listProductsPageLoaded({
      limit: products.filters.limit,
      offset: products.filters.offset,
      page: products.current_page
    })
  }

  render() {
    const { products } = this.props;
    return (
      <div className="container-fluid">
        <h2>List Products</h2>
        <ReactTable
          data={products.products}
          columns={this.columns}
          manual
          defaultPageSize={products.filters.limit}
          page={products.current_page}
          pages={products.total_pages}
          onPageChange={this.handlePageChanged}
          showPageSizeOptions={false}
        />
      </div>
    );
  }
}

export default Container;
