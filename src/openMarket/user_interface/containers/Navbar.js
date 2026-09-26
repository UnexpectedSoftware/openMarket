import React, { Component } from 'react';
import {connect} from 'react-redux';
import {Link} from "react-router";
import Menu, {SubMenu, MenuItem} from 'rc-menu';

class Navbar extends Component {

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
    const {imageFetch} = this.props;
    return (
      <div>
        <div className={"header"}>
          <h1>
            OpenMarket
            <span className="header-aside">
              {imageFetch ? (
                <span className="fetch-progress">
                  <span className="fetch-progress-spinner" />
                  Fetching images {imageFetch.percent}%
                </span>
              ) : null}
              {this.state.version ? <span className="app-version">{this.state.version}</span> : null}
            </span>
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
            <MenuItem key="3"><Link to="/categories">Categories</Link></MenuItem>
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

export default connect(
  state => ({imageFetch: state.imageFetch})
)(Navbar);
