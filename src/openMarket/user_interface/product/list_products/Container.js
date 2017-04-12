// @flow
import React, { Component } from 'react';
import { Link } from 'react-router';
import ReactTable from 'react-table';

const columns = [{
  header: 'Barcode',
  accessor: 'barcode' // String-based value accessors!
},
{
  header: 'Name',
  accessor: 'name'
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
        />



      </div>
    );
  }
}

export default Container;
