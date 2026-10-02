import React, {Component} from 'react';
import {chosenImagePath} from '../components/ImageField';
import placeholder from '../resources/category-placeholder.svg';

export default class CategoryDraft extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = {
      name: '',
      imagePath: null,
      previewUrl: null,
      dragOver: false,
      touched: false,
      fileError: null
    };
  }

  componentWillUnmount() {
    this.revokePreview();
  }

  revokePreview() {
    if (this.state.previewUrl) {
      URL.revokeObjectURL(this.state.previewUrl);
    }
  }

  openPicker = (event) => {
    event.preventDefault();
    if (this.props.saving || !this.fileInput) {
      return;
    }
    this.fileInput.value = '';
    this.fileInput.click();
  };

  onPhotoKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      this.openPicker(event);
    }
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
      imagePath: chosen.imagePath,
      previewUrl: URL.createObjectURL(file)
    });
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

  onNameBlur = (event) => {
    const name = String(event.target.value || '').trim();
    this.setState({
      name,
      touched: true
    });
  };

  save = () => {
    const name = this.state.name.trim();
    if (!name || this.props.saving) {
      this.setState({name, touched: true});
      return;
    }
    const payload = {name};
    if (this.state.imagePath) {
      payload.imagePath = this.state.imagePath;
    }
    this.setState({name});
    this.props.onSave(payload);
  };

  render() {
    const {saving} = this.props;
    const {name, previewUrl, dragOver, touched, fileError} = this.state;
    const photoClass = dragOver ? 'category-card-photo is-over' : 'category-card-photo';
    const nameError = touched && !name.trim() ? 'Required' : null;
    return (
      <article className="category-card is-draft">
        <div
          className={photoClass}
          role="button"
          tabIndex={saving ? -1 : 0}
          aria-label="Add an image"
          title="Add an image"
          onClick={this.openPicker}
          onKeyDown={this.onPhotoKeyDown}
          onDragOver={this.onDragOver}
          onDragLeave={this.onDragLeave}
          onDrop={this.onDrop}
        >
          <img src={previewUrl || placeholder} alt="" />
          <input
            id="category-draft-image"
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
        <input
          className="category-card-name"
          type="text"
          aria-label="Category name"
          placeholder="Name"
          value={name}
          disabled={saving}
          onChange={(event) => this.setState({name: event.target.value})}
          onBlur={this.onNameBlur}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              this.save();
            }
          }}
        />
        {fileError || nameError ? <span className="category-card-error">{fileError || nameError}</span> : null}
        <button
          type="button"
          className="category-card-save"
          disabled={saving || !name.trim()}
          onClick={this.save}
        >
          <i className="fa fa-floppy-o" />
          Save
        </button>
      </article>
    );
  }
}
