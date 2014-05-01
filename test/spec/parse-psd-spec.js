/*global describe: false, it: false, expect: false, require: false */

/* istanbulify ignore file */

var parsePsd = require("../../webapp/js/parse-psd.ts"),
    dummy = require("../../webapp/js/parse-psd"),
    P = parsePsd.parseCorpus,
    _ = require("lodash");

function L(label, text, lemma, index) {
    var ret = {
        label: label,
        text: text
    };
    if (typeof lemma !== "undefined") ret.lemma = lemma;
    if (typeof index !== "undefined") ret.index = index;
    return ret;
}

describe("The PSD parser", function () {
    it("should parse a leaf properly", function () {
        expect(P("( (FOO bar))")).toEqual(
            [{ tree: L("FOO", "bar") }]);
    });
});
