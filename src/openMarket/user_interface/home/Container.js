import React, {Component} from "react";
import {Bar} from 'react-chartjs-2';
import moment from "moment";
import { add } from "../../infrastructure/service/floatCalculatorService";

const BAR_COLOR = 'rgba(33, 150, 243, 0.35)';
const BAR_BORDER = '#2196F3';

function formatEuro(amount) {
  return '€' + Number(amount).toFixed(2);
}

export default class Container extends Component {

  constructor(props,context) {
    super(props, context);
    this.mapChartData = this.mapChartData.bind(this);

    this._chartOptions = {
      maintainAspectRatio: false,
      legend: { display: false },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true,
            callback: value => formatEuro(value)
          }
        }],
        xAxes: [{
          gridLines: { display: false }
        }]
      },
      tooltips: {
        callbacks: {
          label: tooltipItem => formatEuro(tooltipItem.yLabel)
        }
      }
    };

  }


  componentWillMount() {
    const { homePageLoaded } = this.props;
    homePageLoaded();
  }


  mapChartData = () => {
    const days = this.props.statistics.totalAmountByDays;
    return {
      labels: days.map(data => moment(data.createdAt, 'DD/MM/YYYY').format('ddd D')),
      datasets: [
        {
          label: 'Takings',
          backgroundColor: BAR_COLOR,
          borderColor: BAR_BORDER,
          borderWidth: 1,
          hoverBackgroundColor: 'rgba(33, 150, 243, 0.55)',
          data: days.map(data => data.total)
        }
      ]
    };
  }

  render() {
    const takings = this.props.statistics.totalAmountByDays.reduce(
      (sum, day) => add(sum, day.total),
      0
    );
    return (
      <div>
        <div className="container dashboard">
          <h2>Last 7 days</h2>
          <p className="dashboard-takings">
            {formatEuro(takings)}
            <span className="dashboard-takings-label">Takings</span>
          </p>
          <div className="dashboard-chart">
            <Bar data={this.mapChartData()} options={this._chartOptions} />
          </div>
        </div>
      </div>
    );
  }
}
