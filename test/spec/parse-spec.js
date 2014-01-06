/*global describe: false, it: false, expect: false, require: false */

var parse = require('../../webapp/js/parse.js');

require("../string-matcher");

describe("The parser", function () {
    var xml = '<doc><sentence label="IP-MAT"><node label="NP-SBJ"><leaf'
            + ' label="PRO">I</leaf></node></sentence></doc>'
      , html = '<div class="snode" data-label="IP-MAT">IP-MAT <div class="snode"'
            + ' data-label="NP-SBJ">NP-SBJ <div class="snode"'
            + ' data-label="PRO">PRO <span '
            + 'class="wnode">I</span></div></div></div>';
    it("should generate correct HTML from XML", function () {
        expect(parse.parseXmlToHtml(xml).innerHTML).toEqualString(html);
    });
});
