// @flow
import React, { Component } from 'react';
import { Link } from 'react-router';
import NewProductReduxForm from './ReduxForm';

class Container extends Component {

  handleSubmit = (values) => {
    // Do something with the form values
    const { newProductSave } = this.props;
    newProductSave(values);
  }

  componentWillMount() {
    const { newProductFetchCategories } = this.props;
    newProductFetchCategories();
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
    const { categories, edit, initialValues, showUpdateFields, statuses } = this.props;
    return (
      <div>
        <p>Let's {edit ? 'edit a':'create a new'} product!</p>
        <NewProductReduxForm
          edition={edit}
          showUpdateFields={showUpdateFields}
          loadProduct={this.loadProduct}
          onSubmit={this.handleSubmit}
          categoriesList={categories}
          initialValues={initialValues}
          statusesList={statuses}
        />
          <p>
            <Link to="/">
              <i className="fa fa-arrow-left fa-3x" />
            </Link>
          </p>

      </div>
    );
  }
}

export default Container;
