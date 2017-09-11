// @flow
import React, {Component} from "react";
import {Link} from "react-router";
import ReactTable from "react-table";
import DatePicker from 'react-datepicker';
import moment from "moment";
import { defaultLimit } from './model';

class Container extends Component {

  constructor(props,context) {
    super(props, context);
    this.handlePageChanged = this.handlePageChanged.bind(this);
    this.handleStartDateChanged = this.handleStartDateChanged.bind(this);
    this.handleEndDateChanged = this.handleEndDateChanged.bind(this);
    this.handleFilterByDates  = this.handleFilterByDates.bind(this);
    this.renderDetailOrder  = this.renderDetailOrder.bind(this);
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
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        Cell: this.renderDetailOrder
      }
    ];
  }

  renderDetailOrder (data) {
    const { listOrderDetail } = this.props;
    return (<a onClick={(e) => {listOrderDetail(data.row.id);}}>View</a>);
  }


  handlePageChanged (pageIndex) {
    const { listOrderFetchWithFilters, orders } = this.props;
    listOrderFetchWithFilters({
      limit: orders.filters.limit,
      offset: (pageIndex * orders.filters.limit),
      startDate: orders.filters.startDate,
      endDate: orders.filters.endDate,
      page: pageIndex
    });

  }

  handleStartDateChanged(data){
    const { listOrderFiltersStartDateChanged } = this.props;
    data.startOf('day');
    listOrderFiltersStartDateChanged(data);
  }

  handleEndDateChanged(data){
    const { listOrderFiltersEndDateChanged } = this.props;
    data.endOf('day');
    listOrderFiltersEndDateChanged(data);
  }

  handleFilterByDates(event){
    const { listOrderFetchWithFilters, orders } = this.props;
    listOrderFetchWithFilters({
      limit: orders.filters.limit,
      offset: orders.filters.offset,
      startDate: orders.filters.startDate,
      endDate: orders.filters.endDate,
      page: 0
    });
  }

  componentWillMount(){
    this.handleFilterByDates(null);
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
          defaultPageSize={defaultLimit}
          page={orders.current_page}
          pages={orders.total_pages}
          onPageChange={this.handlePageChanged}
          showPageSizeOptions={false}
        />

        <h2>{orders.total} €</h2>



      </div>
    );
  }
}

export default Container;
