// @flow
import React, { Component } from 'react';
import { Link } from 'react-router';
import NewProductReduxForm from './ReduxForm';
import ProductSales from '../../sales/ProductSales';

class Container extends Component {

  componentDidMount() {
    this.blockFileNavigation = (event) => {
      const types = event.dataTransfer && event.dataTransfer.types;
      if (types && Array.prototype.indexOf.call(types, 'Files') !== -1) {
        event.preventDefault();
      }
    };
    window.addEventListener('dragover', this.blockFileNavigation);
    window.addEventListener('drop', this.blockFileNavigation);
  }

  handleSubmit = (values) => {
    const { newProductSave, initialValues, edition } = this.props;
    newProductSave({...values, id: initialValues.id, edition});
  }

  findImage = () => {
    const { findProductImage, barcode, edition, imageLookup } = this.props;
    if (edition || (imageLookup && imageLookup.busy)) {
      return;
    }
    findProductImage(barcode);
  }

  componentWillUnmount() {
    window.removeEventListener('dragover', this.blockFileNavigation);
    window.removeEventListener('drop', this.blockFileNavigation);
    const { productClose } = this.props;
    productClose();
  }

  loadProduct = () => {
    const { editProductFetch, barcode } = this.props;
    editProductFetch(barcode);
  }

  onSalesWindow = (window) => {
    const {productSalesWindowSelected, initialValues} = this.props;
    if (!initialValues || !initialValues.barcode) {
      return;
    }
    productSalesWindowSelected({barcode: initialValues.barcode, window});
  }

  render() {
    const { categories, edition, initialValues, statuses, formKey, categoryId, imageLookup, sales } = this.props;
    return (
      <div className="container-fluid">
        <h2>Let's {edition ? 'edit a':'create a new'} product!</h2>
        <NewProductReduxForm
          key={formKey}
          edition={edition}
          loadProduct={this.loadProduct}
          onSubmit={this.handleSubmit}
          onFindImage={this.findImage}
          categoriesList={categories}
          categoryId={categoryId}
          imageLookup={imageLookup}
          initialValues={initialValues}
          statusesList={statuses}
        />
        {edition && sales ? (
          <ProductSales sales={sales} onWindowChange={this.onSalesWindow} />
        ) : null}
      </div>
    );
  }
}

export default Container;
