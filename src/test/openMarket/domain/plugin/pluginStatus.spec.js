import {expect} from 'chai';
import {PluginStatus, missingSettings, pluginStatus} from '../../../../openMarket/domain/plugin/pluginStatus';

const nif = {key: 'nif', label: 'NIF', required: true, secret: false};
const password = {key: 'certificatePassword', label: 'Certificate password', required: true, secret: true};
const note = {key: 'note', label: 'Note', required: false, secret: false};
const optionalSecret = {key: 'pin', label: 'PIN', required: false, secret: true};

function manifest(settings) {
  return {settings};
}

function judge({settings, state, storedSecrets, compatibility}) {
  return pluginStatus({
    manifest: manifest(settings),
    state,
    storedSecrets,
    compatibility
  });
}

const compatible = {ok: true, invalid: false};

describe('missingSettings', () => {
  it('lists blank required settings in manifest order and keeps their labels', () => {
    expect(missingSettings(
      manifest([nif, password, note, {key: 'environment', label: 'Environment', required: true}]),
      {nif: '  ', environment: null, certificatePassword: 'kept-in-config'},
      []
    )).to.deep.equal([
      {key: 'nif', label: 'NIF'},
      {key: 'certificatePassword', label: 'Certificate password'},
      {key: 'environment', label: 'Environment'}
    ]);
  });

  it('treats a stored secret as present and ignores a secret value left in config', () => {
    expect(missingSettings(manifest([password]), {}, ['certificatePassword'])).to.deep.equal([]);
    expect(missingSettings(manifest([password]), {certificatePassword: 's3cret'}, [])).to.deep.equal([
      {key: 'certificatePassword', label: 'Certificate password'}
    ]);
  });

  it('does not require an optional setting or an optional secret', () => {
    expect(missingSettings(manifest([note, optionalSecret]), {}, [])).to.deep.equal([]);
    expect(missingSettings(manifest([nif]), {nif: 'B123'}, [])).to.deep.equal([]);
  });

  it('treats a missing config and a missing secret list as empty', () => {
    expect(missingSettings(manifest([nif, password]), null, null)).to.deep.equal([
      {key: 'nif', label: 'NIF'},
      {key: 'certificatePassword', label: 'Certificate password'}
    ]);
    expect(missingSettings({}, {}, [])).to.deep.equal([]);
    expect(missingSettings(null, {}, [])).to.deep.equal([]);
  });
});

describe('pluginStatus', () => {
  const ready = {enabled: true, config: {nif: 'B123'}, lastError: null};

  it('is incompatible when the range does not include the app version', () => {
    expect(judge({
      settings: [nif],
      state: ready,
      storedSecrets: [],
      compatibility: {ok: false, invalid: false}
    })).to.deep.equal({
      status: PluginStatus.INCOMPATIBLE,
      missingSettings: []
    });
  });

  it('is incompatible when the range is invalid, ahead of a load error', () => {
    expect(judge({
      settings: [nif],
      state: {enabled: true, config: {}, lastError: 'Plugin failed'},
      storedSecrets: [],
      compatibility: {ok: false, invalid: true}
    })).to.deep.equal({
      status: PluginStatus.INCOMPATIBLE,
      missingSettings: [{key: 'nif', label: 'NIF'}]
    });
  });

  it('needs configuration when a required setting is blank, even if disabled or already in error', () => {
    expect(judge({
      settings: [nif],
      state: {enabled: false, config: {nif: ''}, lastError: null},
      storedSecrets: [],
      compatibility: compatible
    }).status).to.equal(PluginStatus.NEEDS_CONFIGURATION);
    expect(judge({
      settings: [password],
      state: {enabled: true, config: {}, lastError: 'Plugin failed'},
      storedSecrets: [],
      compatibility: compatible
    })).to.deep.equal({
      status: PluginStatus.NEEDS_CONFIGURATION,
      missingSettings: [{key: 'certificatePassword', label: 'Certificate password'}]
    });
  });

  it('is active when a stored secret satisfies the only required secret', () => {
    expect(judge({
      settings: [password],
      state: {enabled: true, config: {}, lastError: null},
      storedSecrets: ['certificatePassword'],
      compatibility: compatible
    })).to.deep.equal({
      status: PluginStatus.ACTIVE,
      missingSettings: []
    });
  });

  it('reports a load error only when the plugin is enabled, compatible and configured', () => {
    expect(judge({
      settings: [],
      state: {enabled: true, config: {}, lastError: 'Plugin must export register'},
      storedSecrets: [],
      compatibility: compatible
    })).to.deep.equal({
      status: PluginStatus.LOAD_ERROR,
      missingSettings: []
    });
    expect(judge({
      settings: [],
      state: {enabled: true, config: {}, lastError: ''},
      storedSecrets: [],
      compatibility: compatible
    }).status).to.equal(PluginStatus.ACTIVE);
  });

  it('is disabled when it is off, including when a previous error is still stored', () => {
    expect(judge({
      settings: [],
      state: {enabled: false, config: {}, lastError: 'old'},
      storedSecrets: [],
      compatibility: compatible
    })).to.deep.equal({
      status: PluginStatus.DISABLED,
      missingSettings: []
    });
    expect(judge({
      settings: [],
      state: null,
      storedSecrets: [],
      compatibility: compatible
    }).status).to.equal(PluginStatus.DISABLED);
  });
});
