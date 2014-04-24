/*global describe: false, it: false, expect: false, require: false */

/* istanbulify ignore file */

var parsePsd = require("../../webapp/js/parse-psd.ts"),
    dummy = require("../../webapp/js/parse-psd"),
    P = parsePsd.parseCorpus;

describe("The PSD parser", function () {
    it("should parse a leaf properly", function () {
        expect(P("( (FOO bar))")).toEqual({ label: "FOO", text: "bar" });
    });
});
