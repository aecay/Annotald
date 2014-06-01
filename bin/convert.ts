///<reference path="./../types/all.d.ts" />

require("typescript-require");
import parsePsd = require("./../webapp/js/parse-psd");
import parse = require("./../webapp/js/parse");
import fs = require("fs");

var xmldom = require("xmldom");

var args = require("minimist")(process.argv.slice(2));

var DOMParser = new xmldom.DOMParser();

if (args.xml) {
    var f = fs.readFileSync(args._[0]).toString();
    var iceFormat = <Element>DOMParser.parseFromString(fs.readFileSync(
        __dirname + "/../webapp/js/psd-grammars/icelandic-format.xml").toString())
        .childNodes[0];
    process.stdout.write(
        parsePsd.jsToXml(parsePsd.parseCorpus(f),
                         parse.parseFormatSpec(iceFormat)));
}
