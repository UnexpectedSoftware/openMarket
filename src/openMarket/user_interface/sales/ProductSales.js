import React from 'react';
import {connect} from 'react-redux';
import {Bar} from 'react-chartjs-2';
import moment from 'moment';
import SalesWindowSelect from './SalesWindowSelect';
import {formatUnits} from './formatUnits';
import {formatMoney} from '../i18n/money';
import {themeColor} from '../style/themeColor';

const chartOptions = {
  maintainAspectRatio: false,
  legend: {display: false},
  scales: {
    yAxes: [{
      ticks: {
        beginAtZero: true,
        callback: value => formatUnits(value)
      }
    }],
    xAxes: [{
      gridLines: {display: false}
    }]
  },
  tooltips: {
    callbacks: {
      label: tooltipItem => formatUnits(tooltipItem.yLabel) + ' sold'
    }
  }
};

function chartData(series) {
  const monthly = series.length > 0 && series[0].soldOn.length === 7;
  return {
    labels: series.map(point =>
      monthly
        ? moment(point.soldOn, 'YYYY-MM').format('MMM YYYY')
        : moment(point.soldOn, 'YYYY-MM-DD').format('ddd D')
    ),
    datasets: [{
      label: 'Sold',
      backgroundColor: themeColor('chart-bar'),
      borderColor: themeColor('chart-bar-border'),
      borderWidth: 1,
      hoverBackgroundColor: themeColor('chart-bar-hover'),
      data: series.map(point => point.quantity)
    }]
  };
}

function ProductSales({sales, onWindowChange, theme}) {
  const series = sales.series || [];
  return (
    <section className="product-block product-sales">
      <div className="product-sales-heading">
        <h3>Sales</h3>
        <SalesWindowSelect value={sales.window} onChange={onWindowChange} />
      </div>
      <p className="product-sales-totals">
        <span>{formatUnits(sales.quantity)} sold</span>
        <span>{formatMoney(sales.amount)}</span>
      </p>
      {series.length > 0 ? (
        <div className="dashboard-chart">
          <Bar key={theme} data={chartData(series)} options={chartOptions} />
        </div>
      ) : null}
    </section>
  );
}

export default connect(state => ({
  theme: state.appearance ? state.appearance.applied : 'mercado'
}))(ProductSales);
