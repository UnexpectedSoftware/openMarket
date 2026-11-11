import {expect} from 'chai';
import {requiredText} from '../../../../openMarket/user_interface/validations/formValidations';

describe('requiredText', () => {
  it('refuses an empty or blank text and accepts one with characters', () => {
    expect(requiredText(undefined)).to.equal('Required');
    expect(requiredText(null)).to.equal('Required');
    expect(requiredText('')).to.equal('Required');
    expect(requiredText('   ')).to.equal('Required');
    expect(requiredText(12)).to.equal('Required');
    expect(requiredText(' Milk ')).to.equal(undefined);
  });
});
