import {mount} from './mount';
import React from 'react';
import {expect} from 'chai';
import ImageField, {imageTypeError} from '../../../../openMarket/user_interface/components/ImageField';

describe('imageTypeError', () => {
  it('keeps the English sentence unless the caller passes one', () => {
    expect(imageTypeError(null)).to.equal(null);
    expect(imageTypeError({type: 'image/png'})).to.equal(null);
    expect(imageTypeError({type: ''})).to.equal(null);
    expect(imageTypeError({type: 'text/plain'})).to.equal('Use a JPEG, PNG, GIF, or WebP image');
    expect(imageTypeError({type: 'text/plain'}, 'Usa una imagen JPEG, PNG, GIF o WebP'))
      .to.equal('Usa una imagen JPEG, PNG, GIF o WebP');
  });
});

describe('ImageField', () => {
  it('shows the English label and hint unless Spanish copy is passed', () => {
    const english = mount(<ImageField inputId="image" />);
    expect(english.node.textContent).to.include('Image');
    expect(english.node.textContent).to.include('Optional. Drop an image here, or choose a file');
    english.unmount();

    const spanish = mount(
      <ImageField
        inputId="category-photo"
        label="Foto"
        hint="Opcional. Suelta una imagen o elige un archivo"
        currentSrc="data:image/png,abc"
      />
    );
    expect(spanish.node.textContent).to.include('Foto');
    expect(spanish.node.querySelector('img').getAttribute('src')).to.equal('data:image/png,abc');
    spanish.unmount();
  });

  it('reports a rejected file with the caller sentence and ignores an empty pick', () => {
    const chosen = [];
    let field = null;
    const view = mount(
      <ImageField
        inputId="category-photo"
        typeError="Usa una imagen JPEG, PNG, GIF o WebP"
        onChosen={value => chosen.push(value)}
        ref={node => { field = node; }}
      />
    );
    field.selectFile(null);
    field.selectFile({type: 'text/plain', name: 'note.txt'});
    expect(view.node.textContent).to.include('Usa una imagen JPEG, PNG, GIF o WebP');
    expect(chosen).to.deep.equal([{
      imagePath: null,
      error: 'Usa una imagen JPEG, PNG, GIF o WebP'
    }]);
    view.unmount();
  });

  it('replaces the preview when the stored image changes and keeps a chosen file', () => {
    const revoked = [];
    const original = URL.revokeObjectURL;
    URL.revokeObjectURL = url => revoked.push(url);
    let field = null;
    const view = mount(
      <ImageField inputId="image" currentSrc="data:first" ref={node => { field = node; }} />
    );

    field.componentWillReceiveProps({inputId: 'image', currentSrc: 'data:first'});
    expect(field.state.previewUrl).to.equal('data:first');

    field.props = {remoteSrc: 'data:remote', currentSrc: 'data:ignored'};
    field.componentWillReceiveProps({remoteSrc: 'data:remote', currentSrc: 'data:other'});
    expect(field.state.previewUrl).to.equal('data:first');

    field.props = {currentSrc: 'data:first'};
    field.setState({previewUrl: 'blob:old', fileError: 'stale', file: null});
    field.componentWillReceiveProps({currentSrc: 'data:next'});
    expect(field.state.previewUrl).to.equal('data:next');
    expect(field.state.fileError).to.equal(null);
    expect(revoked).to.deep.equal(['blob:old']);

    field.props = {currentSrc: 'data:next'};
    field.componentWillReceiveProps({});
    expect(field.state.previewUrl).to.equal(null);

    field.props = {};
    field.componentWillReceiveProps({remoteSrc: 'data:remote', currentSrc: 'data:ignored'});
    expect(field.state.previewUrl).to.equal('data:remote');

    field.setState({file: {type: 'image/png'}, previewUrl: 'blob:kept'});
    field.componentWillReceiveProps({currentSrc: 'data:later', remoteSrc: 'data:later-remote'});
    expect(field.state.previewUrl).to.equal('blob:kept');
    expect(field.state.file).to.deep.equal({type: 'image/png'});

    URL.revokeObjectURL = original;
    view.unmount();
  });
});
