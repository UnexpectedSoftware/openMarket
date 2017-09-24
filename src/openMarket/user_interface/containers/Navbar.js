import React, { Component } from 'react';
import {Link} from "react-router";

export default class Navbar extends Component {
  render() {
    return (
      <div>
        <div className={"container"}>
          <h2>OpenMarket</h2>
          <ul>
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/create_product">new Product!</Link></li>
            <li><Link to="/edit_product">edit Product!</Link></li>
            <li><Link to="/list_products_low_stock">List Products with LOW stock!</Link></li>
            <li><Link to="/create_category">new Category!</Link></li>
            <li><Link to="/create_order">new Order!</Link></li>
            <li><Link to="/list_orders">List Orders!</Link></li>
          </ul>
        </div>
      </div>
    );
  }
}
