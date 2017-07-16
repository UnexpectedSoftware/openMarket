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
    this.handleStartDateChanged = this.handleStartDateChanged.bind(this);
    this.handleEndDateChanged = this.handleEndDateChanged.bind(this);
    this.handleFilterByDates  = this.handleFilterByDates.bind(this);
    this.moneySymbol = "€";
    this.columns = [
      {
        Header: 'Id',
        accessor: 'id',
      },
      {
        Header: 'Created At',
        accessor: 'createdAt',
        Cell: (data) => moment(data.value,"DD/MM/YYYY HH:mm:ss").format("DD/MM/YYYY HH:mm:ss")
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
    const { listOrderFetchWithFilters, orders } = this.props;
    listOrderFetchWithFilters({
      limit: state.pageSize,
      offset: (state.page * state.pageSize),
      startDate: orders.filters.startDate,
      endDate: orders.filters.endDate
    });
    //state.sorted, state.filtered

  }

  handleStartDateChanged(data){
    const { listOrderFiltersStartDateChanged } = this.props;
    listOrderFiltersStartDateChanged(data);
  }

  handleEndDateChanged(data){
    const { listOrderFiltersEndDateChanged } = this.props;
    listOrderFiltersEndDateChanged(data);
  }

  handleFilterByDates(event){
    const { listOrderFetchWithFilters, orders } = this.props;
    listOrderFetchWithFilters({
      limit: orders.filters.limit,
      offset: orders.filters.offset,
      startDate: orders.filters.startDate,
      endDate: orders.filters.endDate
    });
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
            onChange={this.handleStartDateChanged}
            locale="es"
          />
        </div>
        <div>
          <label htmlFor="endDate">End Date</label>
          <DatePicker
            selected={orders.filters.endDate}
            onChange={this.handleEndDateChanged}
            locale="es"
          />
        </div>
        <button onClick={this.handleFilterByDates}>Filter</button>

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
