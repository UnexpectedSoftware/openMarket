// @flow
import React, {Component} from "react";
import {Link} from "react-router";
import NewCategoryReduxForm from './ReduxForm';

class Container extends Component {

  handleSubmit = (values) => {
    // Do something with the form values
    const { newCategorySave } = this.props;
    newCategorySave(values);
  }

  render() {
    return (
      <div>
        <p>Let's create a new category!</p>
        <NewCategoryReduxForm onSubmit={this.handleSubmit}/>
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
