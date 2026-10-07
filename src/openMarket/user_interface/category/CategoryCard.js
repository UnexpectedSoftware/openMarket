import React, {Component} from 'react';
import {chosenImagePath} from '../components/ImageField';
import {formatMoney} from '../i18n/money';
import {formatUnits} from '../sales/formatUnits';
import placeholder from '../resources/category-placeholder.svg';

export default class CategoryCard extends Component {

  constructor(props, context) {
    super(props, context);
    this.cancelled = false;
    this.state = {
      name: props.category.name,
      nameError: null,
      fileError: null,
      previewUrl: null,
      dragOver: false
    };
  }

  componentWillReceiveProps(nextProps) {
    const nameChanged = nextProps.category.name !== this.props.category.name;
    const failed = nextProps.failure && nextProps.failure !== this.props.failure;
    if (nameChanged || failed) {
      this.setState({name: nextProps.category.name, nameError: null});
    }
    if (failed || nextProps.category.imageSrc !== this.props.category.imageSrc) {
      this.revokePreview();
      this.setState({previewUrl: null, fileError: null});
    }
  }

  componentWillUnmount() {
    this.revokePreview();
  }

  revokePreview() {
    if (this.state.previewUrl) {
      URL.revokeObjectURL(this.state.previewUrl);
    }
  }

  commitName = (event) => {
    if (this.cancelled) {
      this.cancelled = false;
      return;
    }
    const raw = event && event.target ? event.target.value : this.state.name;
    const name = String(raw == null ? '' : raw).trim();
    if (!name) {
      this.setState({name: '', nameError: 'Required'});
      return;
    }
    this.setState({name, nameError: null});
    if (name !== this.props.category.name) {
      this.props.onRename(this.props.category.id, name);
    }
  };

  onNameKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelled = true;
      this.setState({name: this.props.category.name, nameError: null});
      event.currentTarget.blur();
    }
  };

  openPicker = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (this.props.saving || !this.fileInput) {
      return;
    }
    this.fileInput.value = '';
    this.fileInput.click();
  };

  selectFile = (file) => {
    this.setState({dragOver: false});
    if (!file || this.props.saving) {
      return;
    }
    const chosen = chosenImagePath(file);
    if (chosen.error) {
      this.setState({fileError: chosen.error});
      return;
    }
    this.revokePreview();
    this.setState({
      fileError: null,
      previewUrl: URL.createObjectURL(file)
    });
    this.props.onReplaceImage(this.props.category.id, chosen.imagePath);
  };

  onDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!this.state.dragOver) {
      this.setState({dragOver: true});
    }
  };

  onDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    this.setState({dragOver: false});
  };

  onDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    this.selectFile(file);
  };

  clearImage = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (this.props.saving) {
      return;
    }
    this.props.onClearImage(this.props.category.id);
  };

  deleteCategory = (event) => {
    event.preventDefault();
    if (this.props.saving) {
      return;
    }
    const name = this.props.category.name;
    if (!window.confirm(`Delete ${name}?`)) {
      return;
    }
    this.props.onDelete(this.props.category.id);
  };

  render() {
    const {category, saving} = this.props;
    const {name, nameError, fileError, previewUrl, dragOver} = this.state;
    const photoClass = dragOver ? 'category-card-photo is-over' : 'category-card-photo';
    return (
      <article className="category-card">
        <div
          className={photoClass}
          onDragOver={this.onDragOver}
          onDragLeave={this.onDragLeave}
          onDrop={this.onDrop}
        >
          <img src={previewUrl || category.imageSrc || placeholder} alt="" />
          <div className="category-card-icons">
            {category.imageSrc ? (
              <button
                type="button"
                className="category-card-icon"
                aria-label="Use default image"
                title="Use default image"
                disabled={saving}
                onClick={this.clearImage}
              >
                <i className="fa fa-times" />
              </button>
            ) : null}
            <button
              type="button"
              className="category-card-icon"
              aria-label="Change image"
              title="Change image"
              disabled={saving}
              onClick={this.openPicker}
            >
              <i className="fa fa-pencil" />
            </button>
            <input
              id={`category-image-${category.id}`}
              className="image-file"
              type="file"
              tabIndex={-1}
              accept="image/jpeg,image/png,image/gif,image/webp"
              ref={(node) => { this.fileInput = node; }}
              onClick={(event) => {
                event.stopPropagation();
                event.currentTarget.value = '';
              }}
              onChange={(event) => {
                const file = event.target.files && event.target.files[0];
                event.target.value = '';
                this.selectFile(file);
              }}
            />
          </div>
        </div>
        <input
          className="category-card-name"
          type="text"
          aria-label="Category name"
          value={name}
          disabled={saving}
          onChange={(event) => this.setState({name: event.target.value, nameError: null})}
          onBlur={this.commitName}
          onKeyDown={this.onNameKeyDown}
        />
        {fileError || nameError ? <span className="category-card-error">{fileError || nameError}</span> : null}
        <dl className="category-card-facts">
          <div>
            <dt>Products</dt>
            <dd>{category.productCount}</dd>
          </div>
          <div>
            <dt>Value</dt>
            <dd title="Sum of base prices">{formatMoney(category.basePriceTotal)}</dd>
          </div>
          <div>
            <dt>Stock</dt>
            <dd>{formatUnits(category.stockTotal)}</dd>
          </div>
          <div>
            <dt>Most sold</dt>
            <dd>
              {category.mostSold ? (
                <a
                  href="#/create_product?edition=true"
                  className="category-card-most-sold-name"
                  title={category.mostSold.name}
                  onClick={(event) => {
                    event.preventDefault();
                    this.props.onOpenProduct(category.mostSold.barcode);
                  }}
                >
                  {category.mostSold.name}
                </a>
              ) : '—'}
            </dd>
          </div>
        </dl>
        {Number(category.productCount) === 0 ? (
          <button
            type="button"
            className="category-card-delete"
            aria-label="Delete category"
            disabled={saving}
            onClick={this.deleteCategory}
          >
            <i className="fa fa-trash" />
            Delete
          </button>
        ) : null}
      </article>
    );
  }
}
