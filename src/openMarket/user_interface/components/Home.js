// @flow
import React, { Component } from 'react';
import { Link } from 'react-router';
import styles from './Home.css';


export default class Home extends Component {
  render() {
    return (
      <div>
        <div className={styles.container}>
          <h2>Home</h2>
          <ul>
            <li><Link to="/counter">to Counter</Link></li>
            <li><Link to="/create_product">new Product!</Link></li>
          </ul>
        </div>
      </div>
    );
  }
}
