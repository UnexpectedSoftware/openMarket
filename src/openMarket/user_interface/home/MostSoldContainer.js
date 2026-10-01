import React, {Component} from 'react';
import SalesWindowSelect from '../sales/SalesWindowSelect';
import {formatUnits} from '../sales/formatUnits';
import {formatMoney} from '../i18n/money';
import {DEFAULT_SALES_WINDOW} from '../../application/service/product/salesWindows';

export default class MostSoldContainer extends Component {

  componentWillMount() {
    const window = this.props.mostSold.window || DEFAULT_SALES_WINDOW;
    this.props.mostSoldRequested(window);
  }

  onWindow = (window) => {
    this.props.mostSoldRequested(window);
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
          {mostSold.loaded && products.length === 0 ? (
            <p className="most-sold-empty">No sales in this period.</p>
          ) : (
            <ol className="most-sold">
              {products.map((product, index) => (
                <li key={product.barcode}>
                  <span className="most-sold-rank">{index + 1}</span>
                  <span className="most-sold-name">{product.name}</span>
                  <span className="most-sold-barcode">{product.barcode}</span>
                  <span className="most-sold-units">{formatUnits(product.quantity)}</span>
                  <span className="most-sold-amount">{formatMoney(product.amount)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    );
  }
}
