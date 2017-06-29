// @flow
import React, { Component } from 'react';
import { Link } from 'react-router';
import ReactTable from 'react-table';
import * as Rx from "rxjs";

const columns = [{
  header: 'Barcode',
  accessor: 'barcode',
  hideFilter: true
},
{
  header: 'Name',
  accessor: 'name',
  filterMethod: (filter, row) => (row[filter.id].includes(filter.value))
},
{
  header: 'Price',
  accessor: 'price',
  hideFilter: true
},

  {
    header: 'Stock',
    accessor: 'stock',
    hideFilter: true
  },
  {
    header: 'Category',
    accessor: 'categoryId',
    hideFilter: true
  },
  {
    header: 'Status',
    accessor: 'status',
    hideFilter: true
  }
];


class Container extends Component {

  filterAndSorting(state, instance){
    this.filterSubject$.next(state.filtering);
  };

  componentWillMount() {
    const { listProductFetch, listProductFetchWithFilters } = this.props;
    this.filterSubject$ = new Rx.Subject();
    this.filterSubject$
      .debounceTime(300)
      .flatMap(filter => Rx.Observable.from(filter)
        .map(filter => listProductFetchWithFilters(filter.value))
        .defaultIfEmpty(Rx.Observable.of(listProductFetch()))
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
          data={products}
          columns={columns}
          showFilters={true}
          manual={true}
        onChange={this.filterAndSorting.bind(this)}
        />



      </div>
    );
  }
}

export default Container;
