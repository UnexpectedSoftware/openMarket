import {expect} from 'chai';
import openMarket from 'src/openMarket';
import sinon from 'sinon';

describe("Test framework", function() {

    it("should return an Observable of campaigns", function() {
        openMarket.get("categories_list_all_use_case")
            .findAll()
            .subscribe(category => {
                expect(category.id).toEqual(jasmine.any(String));
            });
    });
});