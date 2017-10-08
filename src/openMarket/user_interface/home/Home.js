import React, {Component} from "react";
import {Link} from "react-router";
import {Bar, Doughnut} from 'react-chartjs-2';


const data = {
  labels: [
    'Red',
    'Green',
    'Yellow'
  ],
  datasets: [{
    data: [300, 50, 100],
    backgroundColor: [
      '#FF6384',
      '#36A2EB',
      '#FFCE56'
    ],
    hoverBackgroundColor: [
      '#FF6384',
      '#36A2EB',
      '#FFCE56'
    ]
  }]
};

export default class Home extends Component {

  constructor(props,context) {
    super(props, context);

    this._chartOptions = {
      maintainAspectRatio: false
    };


    this._chartData = {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      datasets: [
        {
          label: 'My First dataset',
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
          data: [65, 59, 80, 81, 56, 55, 40]
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
            <Bar data={this._chartData} options={this._chartOptions} width={400} height={200}/>
          </div>
          <div id="bottom">
            <Doughnut data={data} />
          </div>
          <div id="bottom_right">
            <Doughnut data={data} />
          </div>
        </div>
      </div>
    );
  }
}
