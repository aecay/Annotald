/*global describe: false, it: false, expect: false, require: false */

/* istanbulify ignore file */

var parsePsd = require("../../webapp/js/parse-psd.ts"),
    dummy = require("../../webapp/js/parse-psd"),
    P = parsePsd.parseCorpus,
    _ = require("lodash");

function L(label, text, lemma, index) {
    if (typeof lemma === "undefined") lemma = null;
    return {
        label: label,
        text: text,
        lemma: lemma,
        index: index
    };
}

describe("The PSD parser", function () {
    it("should parse a leaf properly", function () {
        expect(P("( (FOO bar))")).toEqual(
            [{ tree: L("FOO", "bar") }]);
        expect(_.isEqual(P("( (FOO bar))"), [{ tree: L("FOO", "bar") }])).toBeTrue();
    });
});
