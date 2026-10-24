import React, {Component} from 'react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const DEFAULT_LABEL = 'Image';
const DEFAULT_HINT = 'Optional. Drop an image here, or choose a file';
const DEFAULT_TYPE_ERROR = 'Use a JPEG, PNG, GIF, or WebP image';

export function pathForImageFile(file) {
  const { webUtils } = require('electron');
  return webUtils.getPathForFile(file);
}

/**
 * @param {?File} file
 * @param {string} [message] Replaces the English sentence when the caller passes one.
 * @returns {?string} error message when the browser type is not an allowed image
 */
export function imageTypeError(file, message) {
  if (file && file.type && ALLOWED_TYPES.indexOf(file.type) === -1) {
    return message || DEFAULT_TYPE_ERROR;
  }
  return null;
}

/**
 * @param {File} file
 * @returns {{imagePath: ?string, error: ?string}}
 */
export function chosenImagePath(file) {
  const typeError = imageTypeError(file);
  if (typeError) {
    return {imagePath: null, error: typeError};
  }
  const imagePath = pathForImageFile(file);
  if (!imagePath) {
    return {imagePath: null, error: 'Could not read the selected file'};
  }
  return {imagePath, error: null};
}

/**
 * Optional image picker. A file can be chosen or dropped.
 * readChosenPath() returns the absolute path when a file is selected.
 */
export default class ImageField extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = {
      file: null,
      previewUrl: props.remoteSrc || props.currentSrc || null,
      dragOver: false,
      fileError: null
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.file) {
      return;
    }
    const nextPreview = nextProps.remoteSrc || nextProps.currentSrc || null;
    const preview = this.props.remoteSrc || this.props.currentSrc || null;
    if (nextPreview === preview) {
      return;
    }
    this.revokePreview();
    this.setState({ previewUrl: nextPreview, fileError: null });
  }

  componentWillUnmount() {
    this.revokePreview();
  }

  revokePreview() {
    if (this.state.previewUrl && this.state.previewUrl.indexOf('blob:') === 0) {
      URL.revokeObjectURL(this.state.previewUrl);
    }
  }

  selectFile = (file) => {
    if (!file) {
      this.setState({ dragOver: false });
      return;
    }
    const chosen = this.chosenFile(file);
    if (chosen.error) {
      this.setState({ dragOver: false, fileError: chosen.error });
      this.notify(chosen);
      return;
    }
    this.revokePreview();
    this.setState({
      file,
      previewUrl: URL.createObjectURL(file),
      dragOver: false,
      fileError: null
    });
    this.notify(chosen);
  };

  chosenFile(file) {
    const typeError = imageTypeError(file, this.props.typeError);
    if (typeError) {
      return {imagePath: null, error: typeError};
    }
    if (!this.props.onChosen) {
      return {imagePath: null, error: null};
    }
    return chosenImagePath(file);
  }

  notify(chosen) {
    if (this.props.onChosen) {
      this.props.onChosen(chosen);
    }
  }

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

  /**
   * @returns {{imagePath: ?string, error: ?string}}
   */
  readChosenPath() {
    const { file } = this.state;
    if (!file) {
      if (this.props.remotePath) {
        return { imagePath: this.props.remotePath, error: null };
      }
      return { imagePath: null, error: null };
    }
    const imagePath = pathForImageFile(file);
    if (!imagePath) {
      this.setState({ fileError: 'Could not read the selected file' });
      return { imagePath: null, error: 'Could not read the selected file' };
    }
    return { imagePath, error: null };
  }

  render() {
    const { inputId } = this.props;
    const { previewUrl, dragOver, fileError } = this.state;
    const label = this.props.label || DEFAULT_LABEL;
    const hint = this.props.hint || DEFAULT_HINT;
    return (
      <div>
        <label htmlFor={inputId}>{label}</label>
        <div
          className={dragOver ? 'image-drop is-over' : 'image-drop'}
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
            : <span>{hint}</span>}
          <input
            id={inputId}
            className="image-file"
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
    );
  }
}
