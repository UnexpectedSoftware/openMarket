import { expect } from 'chai';
import {add, multiply} from "../../../../openMarket/infrastructure/service/floatCalculatorService";

describe('Float calculator', () => {
  describe('Given two number to be multiplied', () => {
    it('should return the result multiplied and rounded to two decimals', () => {

      const givenNumberOne = 1.3;
      const givenNumberTwo = 2.20;

      const result = multiply(givenNumberOne,givenNumberTwo);

      const expectedResult = 2.86;

      expect(result).to.be.equal(expectedResult);

    });
  });

  describe('Given two number to be added', () => {
    it('should return the result added and rounded to two decimals', () => {

      const givenNumberOne = 1.3;
      const givenNumberTwo = 2.20;

      const result = add(givenNumberOne,givenNumberTwo);

      const expectedResult = 3.5;

      expect(result).to.be.equal(expectedResult);

    });
  });


});
