/*global describe: false, it: false, expect: false, require: false */

/* istanbulify ignore file */

describe("The custom matchers", function () {
    it("toDeepEqual", function () {
        expect({foo: "bar"}).toDeepEqual({foo: "bar"});
    });
});
