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

  render() {
    const { categories } = this.props;
    return (
      <div>
        <p>Let's create a new product!</p>
        <NewProductReduxForm onSubmit={this.handleSubmit} categoriesList={categories}/>
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
