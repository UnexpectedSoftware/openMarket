import fs from 'fs';
import path from 'path';
import {expect} from 'chai';

const components = path.join(__dirname, '../../../../openMarket/user_interface/style/components');

/** Shell files migrated onto tokens. tokens.scss is the value list and is exempt. */
const FILES = ['navrail.scss'];

const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe('shell colours', () => {
  FILES.forEach(file => {
    it(`${file} has no hard-coded hex colours`, () => {
      const text = fs.readFileSync(path.join(components, file), 'utf8');
      expect(text).to.not.match(HEX);
    });
  });
});
