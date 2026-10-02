// @flow
import React, {Component} from "react";
import CategoryCard from './CategoryCard';
import CategoryDraft from './CategoryDraft';

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

  render() {
    const {
      categories,
      draftKey,
      savingId,
      savingDraft,
      changeError
    } = this.props.categoriesPage;
    const {
      categoriesSave,
      categoriesRename,
      categoriesImageReplace,
      categoriesImageClear
    } = this.props;
    return (
      <div className="container-fluid">
        <h2>Categories</h2>
        <div className="category-cards">
          <CategoryDraft
            key={draftKey}
            saving={savingDraft}
            onSave={categoriesSave}
          />
          {categories.map(category => (
            <CategoryCard
              key={category.id}
              category={category}
              saving={savingId === category.id}
              failure={changeError && changeError.id === category.id ? changeError : null}
              onRename={categoriesRename}
              onReplaceImage={categoriesImageReplace}
              onClearImage={categoriesImageClear}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default Container;
