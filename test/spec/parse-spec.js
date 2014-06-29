/*global describe: false, it: false, expect: false, require: false,
 DOMParser: false, XMLSerializer: false */

/* istanbulify ignore file */

/* jshint quotmark: false, maxlen: 999 */

var parse = require('../../src/js/parse.ts');
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
    describe("with metadata it", function () {
        var xml = '<corpus><sentence id="2008.OFSI.NAR-SAG,.1">' +
                '<nonterminal category="IP" subcategory="MAT">'+
                '<text category="ADJS">' +
                'Fyrsta' +
                '<meta><case>accusative</case>' +
                '<lemma>fyrstur</lemma></meta>' +
                '</text>' +
                '</nonterminal></sentence></corpus>';
        var html = '<div class="snode" id="sn0"><div class="sentnode" ' +
                'data-id="2008.OFSI.NAR-SAG,.1"><div class="snode" ' +
                'data-category="IP" data-subcategory="MAT"><div ' +
                'class="snode" data-nodetype="text" '  +
                'data-category="ADJS"><span ' +
                'class="wnode">Fyrsta</span><div data-tag="meta" ' +
                'class="meta"><div data-tag="case" ' +
                'class="meta">accusative</div><div data-tag="lemma" ' +
                'class="meta">fyrstur</div></div></div></div></div></div>';
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
        it("should remove empty metadata divs", function () {
            var html = '<div class="snode" data-nodetype="text" data-category="ADJS">' +
                    '<span class="wnode">Fyrsta</span>' +
                    '<div data-tag="meta" class="meta">' +
                    '<div data-tag="case" class="meta">accusative</div>' +
                    '<div data-tag="foo" class="meta"></div>' +
                    '<div data-tag="lemma" class="meta">fyrstur</div>' +
                    '</div></div>';
            var xml = '<text category="ADJS">' +
                    'Fyrsta' +
                    '<meta><case>accusative</case>' +
                    '<lemma>fyrstur</lemma></meta>' +
                    '</text>';

            var doc = document.implementation.createDocument("foo", "", null);

            var xmlout = (new XMLSerializer()).serializeToString(
                parse.__test__.nodeToXml(doc, $(html).get(0)));

            expect(xmlout).toEqualString(xml);
        });
        it("should move metadata to final position", function () {
            var html = '<div class="snode" data-category="IP" data-subcategory="MAT">' +
                    '<div class="meta" data-tag="meta">' +
                    '<div class="meta" data-tag="foo">bar</div></div>' +
                    '<div class="snode" data-nodetype="text" data-category="ADJS">' +
                    '<span class="wnode">Fyrsta</span>' +
                    '<div data-tag="meta" class="meta">' +
                    '<div data-tag="case" class="meta">accusative</div>' +
                    '<div data-tag="lemma" class="meta">fyrstur</div>' +
                    '</div></div></div></div></div>';
            var xml = '<nonterminal category="IP" subcategory="MAT">'+
                    '<text category="ADJS">' +
                    'Fyrsta' +
                    '<meta><case>accusative</case>' +
                    '<lemma>fyrstur</lemma></meta>' +
                    '</text>' +
                    '<meta><foo>bar</foo></meta>' +
                    '</nonterminal>';

            var doc = document.implementation.createDocument("foo", "", null);

            var xmlout = (new XMLSerializer()).serializeToString(
                parse.__test__.nodeToXml(doc, $(html).get(0)));

            expect(xmlout).toEqualString(xml);
        });
    });
});
