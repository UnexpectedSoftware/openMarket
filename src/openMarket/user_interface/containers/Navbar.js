import React, { Component } from 'react';
import {Link} from "react-router";
import Menu, {SubMenu, MenuItem} from 'rc-menu';

export default class Navbar extends Component {

  constructor(props,context) {
    super(props, context);
    this.state =  {
      openKeys: ['1-1'],
    };
  }

  onOpenChange(openKeys) {
    this.setState({
      openKeys,
    });
  }


  render() {
    return (
      <div>
        <div className={"header"}>
          <h1>OpenMarket</h1>
          <Menu
            mode="horizontal"
            onOpenChange={this.onOpenChange.bind(this)}
            openKeys={this.state.openKeys}
            defaultSelectedKeys={this.state.openKeys}
          >
            <MenuItem key="1-1"><Link to="/">Dashboard</Link></MenuItem>
            <SubMenu key="2" title="Products">
              <MenuItem key="2-1"><Link to="/create_product">new Product!</Link></MenuItem>
              <MenuItem key="2-2"><Link to="/edit_product">edit Product!</Link></MenuItem>
              <MenuItem key="2-3"><Link to="/list_products_low_stock">List Products with LOW stock!</Link></MenuItem>
            </SubMenu>
            <SubMenu key="3" title="Categories">
              <MenuItem key="3-1"><Link to="/create_category">new Category!</Link></MenuItem>
            </SubMenu>
            <SubMenu key="4" title="Orders">
              <MenuItem key="4-1"><Link to="/create_order">new Order!</Link></MenuItem>
              <MenuItem key="4-2"><Link to="/list_orders">List Orders!</Link></MenuItem>
            </SubMenu>
          </Menu>
        </div>
      </div>
    );
  }
}
