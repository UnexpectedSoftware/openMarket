// @flow
import React, { Component } from 'react';
import { Link } from 'react-router';
import ReactTable from 'react-table';
import * as Rx from "rxjs";


let filterSubject$ = new Rx.Subject();
filterSubject$.subscribe(filter => console.log(filter));

const filterAndSorting = (state, instance) => {
  filterSubject$.next(state.filtering);
};

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

class Container extends Component {

  componentWillMount() {
    const { listProductFetch } = this.props;
    listProductFetch();
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
        onChange={filterAndSorting}
        />



      </div>
    );
  }
}

export default Container;
