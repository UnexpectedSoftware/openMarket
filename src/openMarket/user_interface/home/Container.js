import React, {Component} from "react";
import {Bar} from 'react-chartjs-2';
import moment from "moment";
import {formatMoney, sumEuros} from "../i18n/money";
import {themeColor} from "../style/themeColor";

function formatEuro(amount) {
  return formatMoney(amount);
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
          backgroundColor: themeColor('chart-bar'),
          borderColor: themeColor('chart-bar-border'),
          borderWidth: 1,
          hoverBackgroundColor: themeColor('chart-bar-hover'),
          data: days.map(data => data.total)
        }
      ]
    };
  }

  render() {
    const takings = sumEuros(this.props.statistics.totalAmountByDays.map(day => day.total));
    return (
      <div>
        <div className="container dashboard">
          <h2>Last 7 days</h2>
          <p className="dashboard-takings">
            {formatEuro(takings)}
            <span className="dashboard-takings-label">Takings</span>
          </p>
          <div className="dashboard-chart">
            <Bar key={this.props.theme} data={this.mapChartData()} options={this._chartOptions} />
          </div>
        </div>
      </div>
    );
  }
}
