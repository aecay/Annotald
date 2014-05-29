/*global describe: false, it: false, expect: false, require: false */

/* istanbulify ignore file */

require("../custom-matchers");

describe("The custom matchers", function () {
    describe("toDeepEqual", function () {
        it("to work", function () {
            expect({foo: "bar"}).toDeepEqual({foo: "bar"});
        });
        it("to fail appropriately", function () {
            expect({foo: "bar"}).not.toDeepEqual({foo: "baz"});
        });
    });
    describe("toEqualXml", function () {
        it("to work", function () {
            expect("<foo bar=\"baz\" quux=\"baz\"/>").toEqualXml(
                "<foo quux=\"baz\" bar=\"baz\"/>"
            );
        });
        it("to fail appropriately", function () {
            expect("<foo bar=\"baz\" quux=\"baz\"/>").not.toEqualXml(
                "<fox quux=\"baz\" bar=\"baz\"/>"
            );
        });
    });

});
