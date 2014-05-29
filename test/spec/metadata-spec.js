/*global describe: false, it: false, expect: false, require: false */

/* istanbulify ignore file */

var metadata = require("../../webapp/js/treedrawing/metadata.ts"),
    setInDict = metadata.__test__.setInDict;

describe("The metadata module", function () {
    it("should export its test functions properly", function () {
        expect(setInDict instanceof Function).toBeTruthy();
    });
    describe("setInDict", function () {
        it("should set in dict properly", function () {
            expect(setInDict({}, "foo", "bar")).toDeepEqual({foo: "bar"});
        });
        it("should set in dict properly (deep)", function () {
            expect(setInDict({}, "foo", {bar : "baz"})).toDeepEqual({foo: {bar : "baz"}});
        });
        it("should set in dict properly (deep, multiple keys)", function () {
            expect(setInDict({}, "foo", {bar: "baz", quux: "abc"})).toDeepEqual(
                {foo: {bar : "baz", quux: "abc"}});
        });
        it("should set in dict properly ignoring other keys", function () {
            expect(setInDict({a: "b"}, "foo", "bar")).toDeepEqual({a: "b", foo: "bar"});
        });
        it("should set in dict properly (deep) ignoring other keys", function () {
            expect(setInDict({a: "b"}, "foo", {bar : "baz"})).toDeepEqual({a: "b",
                                                                           foo: {bar : "baz"}});
        });
        it("should set in dict properly (deep) ignoring other keys (deep)", function () {
            expect(setInDict({foo: {quux: "abc"}}, "foo", {bar : "baz"})).toDeepEqual(
                {foo: {quux: "abc", bar : "baz"}});
        });
        it("should replace in dict properly", function () {
            expect(setInDict({foo: "quux"}, "foo", "bar")).toDeepEqual({foo: "bar"});
        });
        it("should replace in dict properly (deep)", function () {
            expect(setInDict({foo: "quux"}, "foo", {bar : "baz"})).toDeepEqual(
                {foo: {bar : "baz"}});
        });
    });
});
