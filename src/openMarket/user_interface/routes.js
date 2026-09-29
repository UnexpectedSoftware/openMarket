// @flow
import React from 'react';
import { Route, IndexRoute, Redirect } from 'react-router';
import App from './containers/App';
import HomePage from './home/ReduxConnector';
import ProductPage from './product/new_product/ReduxConnector';
import ProductListing from './product/list_products/ReduxConnector';
import CategoriesPage from './category/ReduxConnector';
import OrderPage from './order/new_order/ReduxConnector';
import OrderListing from './order/list_orders/ReduxConnector';


export default (
  <Route path="/" component={App}>
    <IndexRoute component={HomePage} />
    <Route path="/create_product" component={ProductPage} />
    <Route path="/list_products" component={ProductListing} />
    <Redirect from="/list_products_low_stock" to="/list_products?lowStock=1" />
    <Route path="/categories" component={CategoriesPage} />
    <Route path="/create_order" component={OrderPage} />
    <Route path="/list_orders" component={OrderListing} />
  </Route>
);
