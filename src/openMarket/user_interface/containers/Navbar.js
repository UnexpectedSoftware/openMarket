import React, { Component } from 'react';
import {Link} from "react-router";
import Menu, {SubMenu, MenuItem} from 'rc-menu';

export default class Navbar extends Component {
  render() {
    return (
      <div>
        <div className={"header"}>
          <h1>OpenMarket</h1>
          <Menu mode="horizontal">
            <MenuItem><Link to="/">Dashboard</Link></MenuItem>
            <SubMenu title="Products">
              <MenuItem>
                <Link to="/create_product">new Product!</Link>
                <Link to="/edit_product">edit Product!</Link>
                <Link to="/list_products_low_stock">List Products with LOW stock!</Link>
              </MenuItem>
            </SubMenu>
            <SubMenu title="Categories">
              <MenuItem>
                <Link to="/create_category">new Category!</Link>
              </MenuItem>
            </SubMenu>
            <SubMenu title="Orders">
              <MenuItem>
                <Link to="/create_order">new Order!</Link>
                <Link to="/list_orders">List Orders!</Link>
              </MenuItem>
            </SubMenu>
          </Menu>
        </div>
      </div>
    );
  }
}
