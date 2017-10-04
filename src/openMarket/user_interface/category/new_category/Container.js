// @flow
import React, {Component} from "react";
import {Link} from "react-router";
import NewCategoryReduxForm from './ReduxForm';

class Container extends Component {

  handleSubmit = (values) => {
    const { newCategorySave } = this.props;
    newCategorySave(values);
  }

  render() {
    return (
      <div className="container-fluid">
        <h2>Let's create a new category!</h2>
        <NewCategoryReduxForm onSubmit={this.handleSubmit}/>
        <Link className="button button-return" to="/">
          <i className="fa fa-arrow-left" />
          Volver
        </Link>


      </div>
    );
  }
}

export default Container;
