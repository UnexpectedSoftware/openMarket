import {mount} from './mount';
import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';
import {expect} from 'chai';
import NumberField, {parseDecimal} from '../../../../openMarket/user_interface/components/NumberField';

describe('NumberField', () => {
  it('parses comma and dot decimals', () => {
    expect(parseDecimal('0,35')).to.equal(0.35);
    expect(parseDecimal('1.5')).to.equal(1.5);
    expect(parseDecimal('')).to.equal(null);
    expect(parseDecimal('abc')).to.equal(null);
  });

  it('emits a number and keeps a trailing comma in the draft', () => {
    const seen = [];
    const view = mount(
      <NumberField id="weight" label="Weight" name="quantity" unit="kg" value="" onChange={value => seen.push(value)} />
    );
    const input = view.node.querySelector('input');
    expect(input.getAttribute('inputmode')).to.equal('decimal');
    expect(view.node.textContent).to.include('kg');
    input.value = '0,';
    ReactTestUtils.Simulate.change(input);
    expect(seen).to.deep.equal([0]);
    expect(input.value).to.equal('0,');
    input.value = 'abc';
    ReactTestUtils.Simulate.change(input);
    expect(seen).to.deep.equal([0]);
    expect(input.value).to.equal('0,');
    view.unmount();
  });
});
