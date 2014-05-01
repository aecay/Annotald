/*global describe: false, it: false, expect: false, require: false */

/* istanbulify ignore file */

var parsePsd = require("../../webapp/js/parse-psd.ts"),
    dummy = require("../../webapp/js/parse-psd"),
    P = parsePsd.parseCorpus;

function L(label, text, lemma, index) {
    var ret = {
        label: label,
        text: text
    };
    if (typeof lemma !== "undefined") ret.lemma = lemma;
    if (typeof index !== "undefined") ret.index = index;
    return ret;
}

function T(label, index) {
    var pieces = label.split("-");
    var ret = {
        category: pieces[0]
    };
    if (pieces.length > 1) ret.subcategory = ret.pieces.slice(1).join("-");
    if (index) ret.index = index;
    ret.desc = Array.prototype.slice.call(arguments, 2);
    return ret;
}

function R(id, desc) {
    var ret = { tree: desc };
    if (id) ret.id = id;
    return ret;
}

describe("The PSD parser", function () {
    it("should parse a leaf properly", function () {
        expect(P("( (FOO bar))")).toEqual(
            [{ tree: L("FOO", "bar") }]);
    });
    it("should parse a leaf with lemma properly", function () {
        expect(P("( (FOO bar-baz))")).toEqual(
            [{ tree: L("FOO", "bar", "baz") }]);
    });
    it("should parse a tree properly", function () {
        expect(P("( (FOO (BAR baz)))")).toEqual(
            [R(null,
                T("FOO", null, L("BAR", "baz"))
             )]
        );
    });
    it("should parse a tree with ID properly", function () {
        expect(P("( (FOO (BAR baz)) (ID xyz))")).toEqual(
            [R("xyz",
                T("FOO", null, L("BAR", "baz"))
             )]
        );
    });
});
