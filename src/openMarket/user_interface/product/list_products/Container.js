// @flow
import React, { Component } from 'react';
import { Link } from 'react-router';
import ReactTable from 'react-table';
import * as Rx from "rxjs";

class Container extends Component {

  constructor(props,context) {
    super(props, context);
    this.filteredChange = this.filteredChange.bind(this);
    this.filterSubject$ = new Rx.Subject();
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
        accessor: 'categoryId',
        filterable: false
      },
      {
        Header: 'Status',
        accessor: 'status',
        filterable: false
      }
    ];
  }

  filteredChange(column, value){
    this.filterSubject$.next(column);
  };

  handlePageChanged (pageIndex) {
    const { listProductFetch, products } = this.props;
    listProductFetch({
      limit: products.filters.limit,
      offset: (pageIndex * products.filters.limit),
      page: pageIndex
    });

  }

  componentWillMount() {
    const { listProductFetch, listProductFetchWithFilters, products } = this.props;
    console.log(products);
    this.filterSubject$
      .startWith(Rx.Observable.from([]))
      .debounceTime(300)
      .flatMap(filter => Rx.Observable.from(filter)
        .map(filter => listProductFetchWithFilters({
          name: filter.value,
          limit: products.filters.limit,
          offset: products.filters.offset
        }))
        .defaultIfEmpty(Rx.Observable.of(listProductFetch({
          limit: products.filters.limit,
          offset: products.filters.offset,
          page: products.current_page
        })))
      )
      .subscribe();

  }

  render() {
    const { products } = this.props;
    return (
      <div>

        <p>
          <Link to="/">
            <i className="fa fa-arrow-left fa-3x" />
          </Link>
        </p>

        <ReactTable
          data={products.products}
          columns={this.columns}
          filterable
          manual
          onFilteredChange={this.filteredChange}
          defaultPageSize={products.filters.limit}
          page={products.current_page}
          pages={products.total_pages}
          onPageChange={this.handlePageChanged}
        />



      </div>
    );
  }
}

export default Container;
