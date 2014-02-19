/*global describe: false, it: false, expect: false, require: false */

var parse = require('../../webapp/js/parse.js');

require("../string-matcher");

describe("The parser", function () {
    var xml = '<doc><sentence category="IP" subcategory="MAT"><node' +
            ' category="NP" subcategory="SBJ"><leaf'
            + ' category="PRO">I</leaf></node></sentence></doc>'
      , html = '<div class="snode" data-category="IP" data-subcategory="MAT"><div class="snode"'
            + ' data-category="NP" data-subcategory="SBJ"><div class="snode"'
            + ' data-nodetype="leaf" data-category="PRO"><span '
            + 'class="wnode">I</span></div></div></div>';
    it("should generate correct HTML from XML", function () {
        expect(parse.parseXmlToHtml(xml).innerHTML).toEqualString(html);
    });
    it("should fail", function () {
        expect(false);
    });
});
