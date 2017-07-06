// @flow
import React, {Component} from "react";
import {Link} from "react-router";
import ReactTable from "react-table";

class Container extends Component {

  constructor(props,context) {
    super(props, context);
    this.moneySymbol = "€";
    this.columns = [
      {
        Header: 'Id',
        accessor: 'id',
      },
      {
        Header: 'Created At',
        accessor: 'createdAt'
      },
      {
        Header: 'Total',
        accessor: 'total',
        Cell: (data) => data.value +" "+this.moneySymbol
      }
    ];
  }

  componentWillMount() {
    const { listOrderFetch } = this.props;
    listOrderFetch();
  }

  render() {
    const { orders } = this.props;
    return (
      <div>

        <p>
          <Link to="/">
            <i className="fa fa-arrow-left fa-3x" />
          </Link>
        </p>

        <ReactTable
          data={orders}
          columns={this.columns}
          manual
          defaultPageSize={20}
        />



      </div>
    );
  }
}

export default Container;
