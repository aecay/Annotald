/*global describe: false, it: false, expect: false, require: false */

/* istanbulify ignore file */

var parse = require('../../webapp/js/parse.js');

require("../string-matcher");

describe("The parser", function () {
    var xml = '<corpus><sentence category="IP" subcategory="MAT"><nonterminal' +
            ' category="NP" subcategory="SBJ"><text'
            + ' category="PRO">I</text></nonterminal></sentence></corpus>'
      , html = '<div class="snode" id="sn0"><div class="snode" data-category="IP" data-subcategory="MAT"><div class="snode"'
            + ' data-category="NP" data-subcategory="SBJ"><div class="snode"'
            + ' data-nodetype="text" data-category="PRO"><span '
            + 'class="wnode">I</span></div></div></div></div>';
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
});
