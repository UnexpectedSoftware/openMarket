// @flow
import React, { Component } from 'react';
import { Link } from 'react-router';
import NewProductReduxForm from './ReduxForm';

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
    // Do something with the form values
    const { newProductSave, initialValues } = this.props;
    newProductSave({...values,id:initialValues.id});
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

  render() {
    const { categories, edition, initialValues, statuses, formKey } = this.props;
    return (
      <div className="container-fluid">
        <h2>Let's {edition ? 'edit a':'create a new'} product!</h2>
        <NewProductReduxForm
          key={formKey}
          edition={edition}
          loadProduct={this.loadProduct}
          onSubmit={this.handleSubmit}
          categoriesList={categories}
          initialValues={initialValues}
          statusesList={statuses}
        />
      </div>
    );
  }
}

export default Container;
