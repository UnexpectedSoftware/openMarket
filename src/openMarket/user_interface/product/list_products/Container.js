// @flow
import React, { Component } from 'react';
import { Link } from 'react-router';
import ReactTable from 'react-table';
import * as Rx from "rxjs";

class Container extends Component {

  constructor(props,context) {
    super(props, context);
    this.handlePageChanged = this.handlePageChanged.bind(this);
    this.renderDetailProduct = this.renderDetailProduct.bind(this);
    this.handleFilterChanged = this.handleFilterChanged.bind(this);
    this.columns = [{
      Header: 'Barcode',
      accessor: 'barcode'
      },
      {
        Header: 'Name',
        accessor: 'name'
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
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        Cell: this.renderDetailProduct,
        filterable: false
      }
    ];
  }

  renderDetailProduct (data) {
    const { listProductsDetail } = this.props;
    return (<a onClick={(e) => {listProductsDetail(data.row.barcode);}}>View</a>);
  }

  handlePageChanged (pageIndex) {
    const { listProductsPageChanged, products } = this.props;
    listProductsPageChanged({
      type: products.filter_type,
      page: pageIndex,
      limit: products.filters.limit,
      offset: (pageIndex * products.filters.limit)
    });

  }

  handleFilterChanged(column, value){
    const { listProductsFilterChanged} = this.props;
    listProductsFilterChanged(column);
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
          showPagination={!products.filter_type}
          columns={this.columns}
          manual
          defaultPageSize={products.filters.limit}
          page={products.current_page}
          pages={products.total_pages}
          onPageChange={this.handlePageChanged}
          showPageSizeOptions={false}
          filterable
          onFilteredChange={this.handleFilterChanged}
        />
      </div>
    );
  }
}

export default Container;
