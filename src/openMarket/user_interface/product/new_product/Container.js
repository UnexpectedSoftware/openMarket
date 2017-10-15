// @flow
import React, { Component } from 'react';
import { Link } from 'react-router';
import NewProductReduxForm from './ReduxForm';

class Container extends Component {

  handleSubmit = (values) => {
    // Do something with the form values
    const { newProductSave, initialValues } = this.props;
    newProductSave({...values,id:initialValues.id});
  }

  componentWillUnmount() {
    const { productClose } = this.props;
    productClose();
  }

  loadProduct = () => {
    const { editProductFetch, barcode } = this.props;
    editProductFetch(barcode);
  }

  render() {
    const { categories, edition, initialValues, statuses } = this.props;
    return (
      <div className="container-fluid">
        <h2>Let's {edition ? 'edit a':'create a new'} product!</h2>
        <NewProductReduxForm
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
