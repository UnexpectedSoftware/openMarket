// @flow
import React from 'react';
import { Route, IndexRoute } from 'react-router';
import App from './containers/App';
import HomePage from './home/Container';
import CounterPage from './containers/CounterPage';
import ProductPage from './product/new_product/ReduxConnector';
import CategoryPage from './category/new_category/ReduxConnector';
import OrderPage from './order/new_order/ReduxConnector';
import OrderListing from './order/list_orders/ReduxConnector';
import ProductListingLowStock from './product/list_products_low_stock/ReduxConnector';


export default (
  <Route path="/" component={App}>
    <IndexRoute component={HomePage} />
    <Route path="/counter" component={CounterPage} />
    <Route path="/create_product" component={ProductPage} />
    <Route path="/list_products_low_stock" component={ProductListingLowStock} />
    <Route path="/create_category" component={CategoryPage} />
    <Route path="/create_order" component={OrderPage} />
    <Route path="/list_orders" component={OrderListing} />
  </Route>
);
