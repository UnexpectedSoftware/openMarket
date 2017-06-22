// @flow
import React, { Component } from 'react';
import { Link } from 'react-router';
import styles from './Home.css';


export default class Home extends Component {
  render() {
    return (
      <div>
        <div className={"container"}>
          <h2>Home</h2>
          <ul>
            <li><Link to="/counter" className={"counter"}>to Counter</Link></li>
            <li><Link to="/create_product">new Product!</Link></li>
            <li><Link to="/list_products">List Products!</Link></li>
            <li><Link to="/create_category">new Category!</Link></li>
          </ul>
        </div>
      </div>
    );
  }
}
