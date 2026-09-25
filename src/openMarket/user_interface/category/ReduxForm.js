import React, {Component} from 'react';
import {Field, reduxForm} from 'redux-form';
import {required} from '../validations/formValidations';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const renderInput = field => (
  <div>
    <label htmlFor={field.placeholder}>{field.placeholder}</label>
    <input {...field.input} type={field.type}/>
    {field.meta.touched &&
    field.meta.error &&
    <span className="error">{field.meta.error}</span>}
  </div>
);

class ReduxForm extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = {
      file: null,
      previewUrl: null,
      dragOver: false,
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

  selectFile = (file) => {
    if (!file) {
      this.setState({ dragOver: false });
      return;
    }
    if (file.type && ALLOWED_TYPES.indexOf(file.type) === -1) {
      this.setState({
        dragOver: false,
        fileError: 'Use a JPEG, PNG, GIF, or WebP image'
      });
      return;
    }
    this.revokePreview();
    this.setState({
      file,
      previewUrl: URL.createObjectURL(file),
      dragOver: false,
      fileError: null
    });
  };

  onDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!this.state.dragOver) {
      this.setState({ dragOver: true });
    }
  };

  onDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    this.setState({ dragOver: false });
  };

  onDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    this.selectFile(file);
  };

  attachImage = (values) => {
    const { file } = this.state;
    if (!file) {
      this.props.onSubmit({ name: values.name });
      return;
    }
    const { webUtils } = require('electron');
    const imagePath = webUtils.getPathForFile(file);
    if (!imagePath) {
      this.setState({ fileError: 'Could not read the selected file' });
      return;
    }
    this.props.onSubmit({ name: values.name, imagePath });
  };

  render() {
    const { handleSubmit, submitting } = this.props;
    const { previewUrl, dragOver, fileError } = this.state;
    return (
      <form className="category-add" onSubmit={handleSubmit(this.attachImage)}>
        <p className="category-add-label">Add a category</p>
        <Field name="name" component={renderInput} type="text" placeholder="Name" validate={required}/>
        <div>
          <label htmlFor="category-image">Image</label>
          <div
            className={dragOver ? 'category-drop is-over' : 'category-drop'}
            onDragOver={this.onDragOver}
            onDragLeave={this.onDragLeave}
            onDrop={this.onDrop}
            onClick={() => {
              if (!this.fileInput) {
                return;
              }
              this.fileInput.value = '';
              this.fileInput.click();
            }}
          >
            {previewUrl
              ? <img src={previewUrl} alt="" />
              : <span>Optional. Drop an image here, or choose a file</span>}
            <input
              id="category-image"
              className="category-file"
              type="file"
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
          {fileError ? <span className="error">{fileError}</span> : null}
        </div>
        <button type="submit" disabled={submitting}>
          <i className="fa fa-floppy-o" />
          Save
        </button>
      </form>
    );
  }
}

export default reduxForm({
  form: 'categories'
})(ReduxForm);
