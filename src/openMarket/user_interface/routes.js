import React from 'react';
import { Route, IndexRoute, Redirect } from 'react-router';
import App from './containers/App';
import HomePage from './home/ReduxConnector';
import MostSoldPage from './home/MostSoldReduxConnector';
import ProductPage from './product/new_product/ReduxConnector';
import ProductListing from './product/list_products/ReduxConnector';
import CategoriesPage from './category/ReduxConnector';
import OrderPage from './order/new_order/ReduxConnector';
import OrderListing from './order/list_orders/ReduxConnector';
import PluginsPage from './plugin/ReduxConnector';
import SettingsPage from './settings/ReduxConnector';
import GalleryPage from './gallery/GalleryPage';
import {isGalleryEnabled} from './gallery/enabled';

const showGallery = isGalleryEnabled({
  NODE_ENV: process.env.NODE_ENV,
  OPENMARKET_GALLERY: process['env']['OPENMARKET_GALLERY']
});

function childRoutes() {
  const routes = [
    <IndexRoute key="home" component={MostSoldPage} />,
    <Route key="takings" path="/takings" component={HomePage} />,
    <Route key="create-product" path="/create_product" component={ProductPage} />,
    <Route key="list-products" path="/list_products" component={ProductListing} />,
    <Redirect key="low-stock" from="/list_products_low_stock" to="/list_products?lowStock=1" />,
    <Route key="categories" path="/categories" component={CategoriesPage} />,
    <Route key="create-order" path="/create_order" component={OrderPage} />,
    <Route key="list-orders" path="/list_orders" component={OrderListing} />,
    <Route key="plugins" path="/plugins" component={PluginsPage} />,
    <Route key="settings" path="/settings" component={SettingsPage} />
  ];
  if (showGallery) {
    routes.push(<Route key="gallery" path="/gallery" component={GalleryPage} />);
  }
  return routes;
}

export default (
  <Route path="/" component={App}>
    {childRoutes()}
  </Route>
);
