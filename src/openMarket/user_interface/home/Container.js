import React, {Component} from "react";
import {Link} from "react-router";
import {Bar} from 'react-chartjs-2';
import moment from "moment";


export default class Container extends Component {

  constructor(props,context) {
    super(props, context);
    this.mapChartData = this.mapChartData.bind(this);

    this._chartOptions = {
      maintainAspectRatio: false
    };

  }


  componentWillMount() {
    const { homePageLoaded } = this.props;
    homePageLoaded();
  }


  mapChartData = () => {
    const { statistics } = this.props;
    const days = statistics.totalAmountByDays.map(data => moment(data.createdAt,'DD/MM/YYYY').format("MMMM Do"));
    return {
      labels: days,
        datasets: [
      {
        label: 'Last 7 days sells',
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)',
          'rgba(255, 99, 132, 0.2)'
        ],
        borderColor: [
          'rgba(255,99,132,1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255,99,132,1)'
        ],
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(255,99,132,0.4)',
        hoverBorderColor: 'rgba(255,99,132,1)',
        data: statistics.totalAmountByDays.map(data => data.total)
      }
    ]
    };
  }

  render() {
    return (
      <div>
        <div className={"container"}>
          <h2>Dashboard</h2>
          <div id="top">
            <Bar data={this.mapChartData()} options={this._chartOptions} width={400} height={600}/>
          </div>
        </div>
      </div>
    );
  }
}
