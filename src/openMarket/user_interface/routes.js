// @flow
import React from 'react';
import { Route, IndexRoute } from 'react-router';
import App from './containers/App';
import HomePage from './home/Container';
import CounterPage from './containers/CounterPage';
import ProductPage from './product/new_product/ReduxConnector';
import CategoryPage from './category/new_category/ReduxConnector';
import ProductListing from './product/list_products/ReduxConnector';


export default (
  <Route path="/" component={App}>
    <IndexRoute component={HomePage} />
    <Route path="/counter" component={CounterPage} />
    <Route path="/create_product" component={ProductPage} />
    <Route path="/list_products" component={ProductListing} />
    <Route path="/create_category" component={CategoryPage} />
  </Route>
);
