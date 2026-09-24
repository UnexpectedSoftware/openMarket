import React, { Component } from 'react';
import {Link} from "react-router";
import Menu, {SubMenu, MenuItem} from 'rc-menu';

export default class Navbar extends Component {

  constructor(props,context) {
    super(props, context);
    this.state =  {
      openKeys: ['1-1'],
      version: process.env.OPENMARKET_VERSION
    };
  }

  onOpenChange(openKeys) {
    this.setState({
      openKeys,
    });
  }

  componentDidMount() {
    if (this.state.version) {
      document.title = `OpenMarket ${this.state.version}`;
    }
  }


  render() {
    return (
      <div>
        <div className={"header"}>
          <h1>
            OpenMarket
            {this.state.version ? <span className="app-version">{this.state.version}</span> : null}
          </h1>
          <Menu
            mode="horizontal"
            onOpenChange={this.onOpenChange.bind(this)}
            openKeys={this.state.openKeys}
            defaultSelectedKeys={this.state.openKeys}
          >
            <MenuItem key="1-1"><Link to="/">Dashboard</Link></MenuItem>
            <SubMenu key="2" title="Products">
              <MenuItem key="2-1"><Link to="/create_product">new Product!</Link></MenuItem>
              <MenuItem key="2-2"><Link to="/list_products">List Products!</Link></MenuItem>
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
