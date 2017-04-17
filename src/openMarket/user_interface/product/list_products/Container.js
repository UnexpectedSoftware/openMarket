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
  header: 'description',
  accessor: 'description'
},
{
  header: 'Price',
  accessor: 'price'
},
  {
    header: 'Base Price',
    accessor: 'basePrice'
  },

  {
    header: 'Stock',
    accessor: 'stock'
  },
  {
    header: 'Stock minimum',
    accessor: 'stockMin'
  },
  {
    header: 'Category',
    accessor: 'categoryId'
  },
  {
    header: 'Status',
    accessor: 'status'
  }
];
const filterSubject$ = new Rx.Subject();

class Container extends Component {

  filterAndSorting(state, instance){
    filterSubject$.next(state.filtering);
  };

  componentWillMount() {
    const { listProductFetch, listProductFetchWithFilters } = this.props;
    listProductFetch();

    filterSubject$
      .debounceTime(300)
      .filter(filter => filter[0]!== undefined)
      .map(filter => listProductFetchWithFilters(filter[0].value))
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
        onChange={this.filterAndSorting}
        />



      </div>
    );
  }
}

export default Container;
