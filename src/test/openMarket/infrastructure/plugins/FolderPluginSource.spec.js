import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import FolderPluginSource from '../../../../openMarket/infrastructure/plugins/FolderPluginSource';

function writePlugin(root, id, manifest, index) {
  const folder = path.join(root, id);
  fs.mkdirSync(folder, {recursive: true});
  fs.writeFileSync(path.join(folder, 'plugin.json'), JSON.stringify(manifest));
  if (index != null) {
    fs.writeFileSync(path.join(folder, 'index.js'), index);
  }
  return folder;
}

describe('FolderPluginSource', () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-plugin-src-'));
  });

  it('lists a manifest without running index.js', () => {
    writePlugin(root, 'sample', {
      id: 'sample',
      name: 'Sample',
      description: 'A fixture',
      version: '1.0.0',
      openmarket: '>=1.15.0 <2',
      settings: [{key: 'nif', label: 'NIF', required: true}]
    }, 'throw new Error("loaded");\n');

    let listed;
    new FolderPluginSource({directory: root}).list().subscribe(plugins => {
      listed = plugins;
    });

    expect(listed).to.have.lengthOf(1);
    expect(listed[0]).to.include({
      id: 'sample',
      name: 'Sample',
      description: 'A fixture',
      version: '1.0.0',
      openmarket: '>=1.15.0 <2',
      main: 'index.js'
    });
    expect(listed[0].settings).to.deep.equal([{key: 'nif', label: 'NIF', required: true}]);
  });

  it('skips a bad manifest, a mismatched id, and a main path that escapes the folder', () => {
    fs.writeFileSync(path.join(root, 'notes.txt'), 'nope');
    fs.mkdirSync(path.join(root, 'broken'));
    fs.writeFileSync(path.join(root, 'broken', 'plugin.json'), '{');
    writePlugin(root, 'sample', {id: 'other', name: 'Other'});
    writePlugin(root, 'escape', {id: 'escape', name: 'Escape', main: '../outside.js'});

    let listed;
    new FolderPluginSource({directory: root}).list().subscribe(plugins => {
      listed = plugins;
    });

    expect(listed).to.deep.equal([]);
  });
});
