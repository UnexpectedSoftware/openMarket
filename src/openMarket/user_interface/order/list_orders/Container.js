// @flow
import React, {Component} from "react";
import {Link} from "react-router";
import ReactTable from "react-table";
import DatePicker from 'react-datepicker';
import moment from "moment";

class Container extends Component {

  constructor(props,context) {
    super(props, context);
    this.fetchData = this.fetchData.bind(this);
    this.moneySymbol = "€";
    this.columns = [
      {
        Header: 'Id',
        accessor: 'id',
      },
      {
        Header: 'Created At',
        accessor: 'createdAt',
        Cell: (data) => moment(data.value).format("DD-MM-YYYY HH:mm:ss")
      },
      {
        Header: 'Total',
        accessor: 'total',
        Cell: (data) => data.value +" "+this.moneySymbol
      }
    ];
  }

  fetchData (state, instance) {
    //this.setState({loading: true})
    const { listOrderFetchWithFilters } = this.props;
    listOrderFetchWithFilters({
      limit: state.pageSize,
      offset: (state.page * state.pageSize)
    });
    //state.sorted, state.filtered

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
        <div>
          <label htmlFor="startDate">Start Date</label>
          <DatePicker
            selected={orders.filters.startDate}
            onChange={this.handleChange}
          />
        </div>
        <div>
          <label htmlFor="endDate">End Date</label>
          <DatePicker
            selected={orders.filters.endDate}
            onChange={this.handleChange}
          />
        </div>

        <ReactTable
          data={orders.orders}
          columns={this.columns}
          manual
          defaultPageSize={20}
          onFetchData={this.fetchData}
        />

        <h2>{orders.total} €</h2>



      </div>
    );
  }
}

export default Container;
