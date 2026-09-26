// @flow
import React, {Component} from "react";
import CategoryForm from './ReduxForm';
import placeholder from '../resources/category-placeholder.svg';

class Container extends Component {

  componentWillMount() {
    const { categoriesPageLoaded } = this.props;
    categoriesPageLoaded();
  }

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

  componentWillUnmount() {
    window.removeEventListener('dragover', this.blockFileNavigation);
    window.removeEventListener('drop', this.blockFileNavigation);
  }

  handleSubmit = (values) => {
    const { categoriesSave } = this.props;
    categoriesSave(values);
  };

  render() {
    const { categories, formKey } = this.props.categoriesPage;
    return (
      <div className="container-fluid">
        <h2>Categories</h2>
        <CategoryForm key={formKey} onSubmit={this.handleSubmit}/>
        <div className="category-cards">
          {categories.map(category => (
            <article className="category-card" key={category.id}>
              <img src={category.imageSrc || placeholder} alt="" />
              <p title={category.name}>{category.name}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }
}

export default Container;
