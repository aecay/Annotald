/*global describe: false, it: false, expect: false, require: false */

/* istanbulify ignore file */

var parsePsd = require("../../webapp/js/parse-psd.ts"),
    dummy = require("../../webapp/js/parse-psd"),
    P = parsePsd.parseCorpus,
    _ = require("lodash");

function L(label, text, lemma, index) {
    var ret = {
        type: "text",
        label: label,
        text: text
    };
    if (typeof lemma !== "undefined") ret.lemma = lemma;
    if (typeof index !== "undefined") ret.index = index;
    return ret;
}

function Tr(label, type, index, idxtype) {
    var ret = {
        type: "trace",
        label: label,
        index: Idx(index, idxtype),
        tracetype: type
    };
    return ret;
}

function Ec(label, type, index) {
    var ret = {
        type: "ec",
        label: label,
        ectype: type
    };
    if (index) ret.index = index;
    return ret;
}

function Com(type, text) {
    var ret = {
        type: "comment",
        comtype: type,
        text: text,
        label: "CODE"
    };
    return ret;
}

function Idx(index, type) {
    return {
        index: index + "",
        idxtype: type === "=" ? "gap" : "regular"
    };
}

function T(label, index) {
    var ret = {
        label: label
    };
    if (index) ret.index = index;
    ret.desc = Array.prototype.slice.call(arguments, 2);
    return ret;
}

function R(id, desc) {
    var ret = { tree: desc };
    if (id) ret.id = id;
    return ret;
}

function X (name) {
    if (arguments.length === 1) {
        return "<" + name + " />";
    }
    var extraArgs = Array.prototype.slice.call(arguments, 1);
    if (_.isObject(extraArgs[0])) {
        var attrs = extraArgs.shift();
        var strAttrs = " " + _.map(attrs, function (val, key) {
            return key + "=\"" + val + "\"";
        }).join(" ");
    }
    return "<" + name + (strAttrs || "") + ">" +
        extraArgs.join("") +
        "</" + name + ">";
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
    it("should parse a tree with subcategories properly", function () {
        expect(P("( (FOO-ABC (BAR baz)))")).toEqual(
            [R(null,
               T("FOO-ABC", null, L("BAR", "baz"))
              )]
        );
    });
    it("should parse a tree with trace properly", function () {
        expect(P("( (FOO (BAR *T*-1)))")).toEqual(
            [R(null,
               T("FOO", null, Tr("BAR", "T", 1, "-"))
              )]
        );
    });
    it("should parse a tree with empty category properly", function () {
        expect(P("( (FOO (BAR *pro*)))")).toEqual(
            [R(null,
               T("FOO", null, Ec("BAR", "pro"))
              )]
        );
    });
    it("should parse a tree with comment properly", function () {
        expect(P("( (FOO (CODE {COM:foo_bar})))")).toEqual(
            [R(null,
               T("FOO", null, Com("COM", "foo_bar"))
              )]
        );
    });
    it("should parse a tree with free comment properly", function () {
        expect(P("( (FOO (CODE foo_bar)))")).toEqual(
            [R(null,
               T("FOO", null, {type: "comment", text: "foo_bar", label: "CODE"})
              )]
        );
    });
    describe("conversion to XML", function () {
        function toXml (x) {
            return parsePsd.jsToXml(P(x));
        }
        it("should convert a simple tree correctly", function () {
            expect(toXml("( (FOO bar))")).toEqualXml(
                X("corpus",
                  X("sentence",
                    X("text", {category: "FOO"}, "bar")))
            );
        });
        it("should convert a leaf with lemma properly", function () {
            expect(toXml("( (FOO bar-baz))")).toEqualXml(
                X("corpus",
                  X("sentence",
                    X("text", {category: "FOO"}, X("meta", X("lemma", "baz")),
                      "bar")))
            );
        });
        it("should convert a tree properly", function () {
            expect(toXml("( (FOO (BAR baz)))")).toEqualXml(
                X("corpus",
                  X("sentence",
                    X("nonterminal", {category: "FOO"},
                      X("text", {category: "BAR"}, "baz"))))
            );
        });
        it("should convert a tree with ID properly", function () {
            expect(toXml("( (FOO (BAR baz)) (ID xyz))")).toEqualXml(
                X("corpus",
                  X("sentence" ,{id: "xyz"},
                    X("nonterminal", {category: "FOO"},
                      X("text", {category: "BAR"}, "baz"))))
            );
        });
        it("should convert a tree with subcategories properly", function () {
            expect(toXml("( (FOO-ABC (BAR baz)))")).toEqualXml(
                X("corpus",
                  X("sentence",
                    X("nonterminal", {category: "FOO", subcategory: "ABC"},
                      X("text", {category: "BAR"}, "baz"))))
            );
        });
        it("should convert a tree with trace properly", function () {
            expect(toXml("( (FOO (BAR *T*-1)))")).toEqualXml(
                X("corpus",
                  X("sentence",
                    X("nonterminal", {category: "FOO"},
                      X("trace", {category: "BAR", tracetype: "T",
                                  index: "1", idxtype: "regular"}))))
            );
        });
        it("should convert a tree with empty category properly", function () {
            expect(toXml("( (FOO (BAR *pro*)))")).toEqualXml(
                X("corpus",
                  X("sentence",
                    X("nonterminal", {category: "FOO"},
                      X("ec", {category: "BAR", ectype: "pro"}))))
            );
        });
        it("should convert a tree with comment properly", function () {
            expect(toXml("( (FOO (CODE {COM:foo_bar})))")).toEqualXml(
                X("corpus",
                  X("sentence",
                    X("nonterminal", {category: "FOO"},
                      X("comment", {category: "CODE", comtype: "COM"}, "foo_bar"))))
            );
        });
        it("should convert a tree with free comment properly", function () {
            expect(toXml("( (FOO (CODE foo_bar)))")).toEqualXml(
                X("corpus",
                  X("sentence",
                    X("nonterminal", {category: "FOO"},
                      X("comment", {category: "CODE", comtype: "COM"}, "foo_bar"))))
            );
        });
    });
});
