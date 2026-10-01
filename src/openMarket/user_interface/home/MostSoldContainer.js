import React, {Component} from 'react';
import SalesWindowSelect from '../sales/SalesWindowSelect';
import {DEFAULT_SALES_WINDOW} from '../../application/service/product/salesWindows';
import MostSoldChart from './MostSoldChart';

export default class MostSoldContainer extends Component {

  componentWillMount() {
    const window = this.props.mostSold.window || DEFAULT_SALES_WINDOW;
    this.props.mostSoldRequested(window);
  }

  onWindow = (window) => {
    this.props.mostSoldRequested(window);
  }

  onOpen = (barcode) => {
    this.props.listProductsDetail(barcode);
  }

  render() {
    const {mostSold} = this.props;
    const products = mostSold.products || [];
    return (
      <div>
        <div className="container dashboard">
          <div className="dashboard-toolbar">
            <h2>Most sold</h2>
            <SalesWindowSelect value={mostSold.window} onChange={this.onWindow} />
          </div>
          {products.length > 0 ? (
            <MostSoldChart products={products} onOpen={this.onOpen} />
          ) : mostSold.loaded ? (
            <p className="most-sold-empty">No sales in this period.</p>
          ) : null}
        </div>
      </div>
    );
  }
}
