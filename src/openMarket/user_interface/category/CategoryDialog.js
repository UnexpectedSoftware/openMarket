import React, {Component} from 'react';
import Button from '../components/Button';
import Dialog from '../components/Dialog';
import ImageField from '../components/ImageField';
import TextField from '../components/TextField';

/**
 * @param {string} mode
 * @returns {string}
 */
export function dialogTitle(mode) {
  if (mode === 'edit') {
    return 'Editar categoría';
  }
  return 'Nueva categoría';
}

/**
 * @param {{imageUrl?: string | null, imagePath?: string | null}} dialog
 * @returns {boolean}
 */
export function showsDefaultImage(dialog) {
  return !!(dialog && (dialog.imageUrl || dialog.imagePath));
}

export default class CategoryDialog extends Component {

  constructor(props, context) {
    super(props, context);
    this.nameInput = {current: null};
    this.photo = null;
    this.state = {previewEpoch: 0};
    this.onNameKeyDown = this.onNameKeyDown.bind(this);
    this.onChosen = this.onChosen.bind(this);
    this.changeImage = this.changeImage.bind(this);
    this.useDefault = this.useDefault.bind(this);
    this.setPhoto = this.setPhoto.bind(this);
    this.setNameInput = this.setNameInput.bind(this);
  }

  setPhoto(node) {
    this.photo = node;
  }

  setNameInput(node) {
    this.nameInput.current = node;
  }

  onNameKeyDown(event) {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    this.props.onSave();
  }

  onChosen(chosen) {
    const result = chosen || {};
    if (result.error) {
      this.props.onDraft({
        imagePath: null,
        fileError: result.error,
        clearImage: false
      });
      return;
    }
    this.props.onDraft({
      imagePath: result.imagePath,
      fileError: null,
      clearImage: false
    });
  }

  changeImage() {
    const input = this.photo && this.photo.querySelector('input[type="file"]');
    if (!input) {
      return;
    }
    input.click();
  }

  useDefault() {
    this.setState({previewEpoch: this.state.previewEpoch + 1});
    this.props.onDraft({
      clearImage: true,
      imagePath: null,
      imageUrl: null,
      fileError: null
    });
  }

  render() {
    const dialog = this.props.dialog;
    return (
      <Dialog
        open
        title={dialogTitle(dialog.mode)}
        initialFocusRef={this.nameInput}
        onClose={this.props.onClose}
        actions={this.actions(dialog)}
      >
        <div onKeyDown={this.onNameKeyDown}>
          <TextField
            id="category-name"
            label="Nombre"
            value={dialog.name}
            error={dialog.nameError}
            required
            inputRef={this.setNameInput}
            onChange={event => this.props.onDraft({name: event.target.value})}
          />
        </div>
        <div className="category-dialog-photo" ref={this.setPhoto}>
          <ImageField
            key={this.state.previewEpoch}
            inputId="category-photo"
            label="Foto"
            hint="Opcional. Suelta una imagen o elige un archivo"
            typeError="Usa una imagen JPEG, PNG, GIF o WebP"
            currentSrc={dialog.imageUrl}
            onChosen={this.onChosen}
          />
          <div className="category-dialog-photo-actions">
            <Button variant="secondary" onClick={this.changeImage}>Cambiar imagen</Button>
            {showsDefaultImage(dialog) ? (
              <Button variant="ghost" onClick={this.useDefault}>Usar imagen por defecto</Button>
            ) : null}
          </div>
        </div>
        {dialog.error ? <p className="category-dialog-error" role="alert">{dialog.error}</p> : null}
      </Dialog>
    );
  }

  actions(dialog) {
    return (
      <span className="category-dialog-actions">
        <Button variant="secondary" disabled={dialog.saving} onClick={this.props.onClose}>Cancelar</Button>
        <Button busy={dialog.saving} disabled={!!dialog.fileError} onClick={this.props.onSave}>Guardar</Button>
      </span>
    );
  }
}
