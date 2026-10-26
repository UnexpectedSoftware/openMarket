import {expect} from 'chai';
import {parseSettingObject} from '../../../../openMarket/infrastructure/service/readSettingText';

describe('parseSettingObject', () => {
  it('returns a stored object and an empty object for anything else', () => {
    expect(parseSettingObject('{"locale":"es"}', 'Could not read the language')).to.deep.equal({locale: 'es'});
    expect(parseSettingObject('null', 'Could not read the language')).to.deep.equal({});
    expect(parseSettingObject('[]', 'Could not read the printer settings')).to.deep.equal({});
    expect(parseSettingObject('"es"', 'Could not read the language')).to.deep.equal({});
    expect(parseSettingObject('1', 'Could not read the language')).to.deep.equal({});
    expect(() => parseSettingObject('{', 'Could not read the language')).to.throw(/Could not read the language/);
  });
});
