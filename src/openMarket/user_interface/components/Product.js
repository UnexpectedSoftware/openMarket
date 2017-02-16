// @flow
import React, { Component } from 'react';
import { Link } from 'react-router';
import ProductForm from './ProductForm';

class Product extends Component {
  props: {
    product: number
  };

  handleSubmit = (values) => {
    // Do something with the form values
    console.log(values);
  }
  render() {
    const { product } = this.props;
    return (
      <div>
        <p>Let's create a new product!</p>
        <ProductForm onSubmit={this.handleSubmit} />
          <p>
            <Link to="/">
              <i className="fa fa-arrow-left fa-3x" />
            </Link>
          </p>

      </div>
    );
  }
}

export default Product;