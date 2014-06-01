/*global describe: false, it: false, expect: false, require: false,
 DOMParser: false */

/* istanbulify ignore file */

/* jshint quotmark: false, maxlen: 999 */

var parse = require('../../webapp/js/parse');
var $ = require("jquery");

describe("The parser", function () {
    var xml = '<corpus><sentence><nonterminal category="IP" subcategory="MAT"><nonterminal' +
            ' category="NP" subcategory="SBJ"><text' +
            ' category="PRO">I</text></nonterminal></nonterminal></sentence></corpus>',
        html = '<div class="snode" id="sn0"><div class="sentnode"><div class="snode"' +
            ' data-category="IP" data-subcategory="MAT"><div class="snode"' +
            ' data-category="NP" data-subcategory="SBJ"><div class="snode"' +
            ' data-nodetype="text" data-category="PRO"><span ' +
            'class="wnode">I</span></div></div></div></div></div>';
    it("should generate correct HTML from XML", function () {
        expect(parse.parseXmlToHtml(xml).outerHTML).toEqualString(html);
    });
    it("should generate correct XML from HTML", function () {
        expect(parse.parseHtmlToXml(html)).toEqualString(xml);
    });
    it("should be idempotent on HTML", function () {
        expect(parse.parseHtmlToXml(parse.parseXmlToHtml(xml))).toEqualString(xml);
    });
    it("should be idempotent on XML", function () {
        expect(parse.parseXmlToHtml(parse.parseHtmlToXml(html)).outerHTML).toEqualString(html);
    });
    it("should handle text with metadata", function () {
        expect(parse.parseXmlToHtml('<corpus><sentence id="2008.OFSI.NAR-SAG,.1">' +
                                    '<nonterminal category="IP" subcategory="MAT">'+
                                    '<text category="ADJS">' +
                                    '<meta><A>yes</A>' +
                                    '<lemma>fyrstur</lemma></meta>' +
                                    'Fyrsta</text>' +
                                    '</nonterminal></sentence></corpus>').outerHTML)
            .toEqualString(
                ""
            );
    });
});

describe("The action parser", function () {
    describe("nodeToAction", function () {
        var nta = parse.__test__.nodeToAction;
        it("should parse a basic node properly", function () {
            expect(nta($("<foo>bar</foo>"))).toDeepEqual({foo: "bar"});
        });
        it("should parse a deep node properly", function () {
            expect(nta($("<foo><bar>abc</bar></foo>"))).toDeepEqual({foo: {bar: "abc"}});
        });
        it("should parse a deep multiple node properly", function () {
            expect(nta($("<foo><bar>abc</bar><quux>def</quux></foo>"))).toDeepEqual(
                {foo: {bar: "abc", "quux": "def"}});
        });
    });
    describe("parseFormatSpec", function () {
        var pfs = parse.parseFormatSpec;
        it("should handle dashTags", function () {
            var dom = new DOMParser().parseFromString(
                "<x><dashTags><LFD><semantics><left-dislocate>yes</left-dislocate></semantics></dashTags></x>",
                "text/xml").childNodes[0];
            var res = pfs(dom);
            expect(res).toDeepEqual({defaults:
                                     {LFD: {semantics: {"left-dislocate": "yes"}}},
                                     defaultSubcategories:[],
                                     byLabel:{}});
        });
        it("should handle subcategories", function () {
            var dom = new DOMParser().parseFromString(
                "<x><subcategories><XXX /><YYY /></subcategories></x>",
                "text/xml").childNodes[0];
            var res = pfs(dom);
            expect(res).toDeepEqual({defaults: {},
                                     defaultSubcategories:["XXX","YYY"],
                                     byLabel:{}});
        });
        it("should handle byLabel", function () {
            var dom = new DOMParser().parseFromString(
                "<x>" +
                    "<byLabel><NP><subcategories><SBJ /></subcategories>" +
                    "<dashTags><RSP><left-dislocate>resume</left-dislocate></RSP>" +
                    "</dashTags></NP></byLabel></x>",
                "text/xml").childNodes[0];
            var res = pfs(dom);
            expect(res).toDeepEqual({defaults: {},
                                     defaultSubcategories:[],
                                     byLabel: {
                                         NP: {
                                             subcategories: ["SBJ"],
                                             metadataKeys:
                                             {
                                                 RSP: {
                                                     "left-dislocate": "resume"
                                                 }
                                             }
                                         }
                                     }});
        });
        it("should handle everything", function () {
            var dom = new DOMParser().parseFromString(
                "<x><subcategories><XXX /><YYY /></subcategories>" +
                    "<dashTags><LFD><left-dislocate>yes</left-dislocate></LFD></dashTags>" +
                    "<byLabel><NP><subcategories><SBJ /></subcategories>" +
                    "<dashTags><RSP><left-dislocate>resume</left-dislocate></RSP>" +
                    "</dashTags></NP></byLabel></x>",
                "text/xml").childNodes[0];
            var res = pfs(dom);
            expect(res).toDeepEqual({defaults: {LFD: {"left-dislocate": "yes"}},
                                     defaultSubcategories:["XXX","YYY"],
                                     byLabel: {
                                         NP: {
                                             subcategories: ["SBJ"],
                                             metadataKeys:
                                             {
                                                 RSP: {
                                                     "left-dislocate": "resume"
                                                 }
                                             }
                                         }
                                     }});
        });
    });
});
