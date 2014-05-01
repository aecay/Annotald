///<reference path="./../../types/all.d.ts" />

var peg = require("pegjs");
var fs = require("fs");

var grammar = fs.readFileSync(__dirname + "/psd-grammars/main.txt");

var icelandicText = fs.readFileSync(__dirname + "/psd-grammars/icelandic-text.txt");

var icelandicLeaf = fs.readFileSync(__dirname + "/psd-grammars/icelandic-leaf.txt");

// TODO: case as part of the return value

export function parseCorpus (corpus : string) : any {
    var parser = peg.buildParser(grammar + icelandicText + icelandicLeaf);
    var res = parser.parse(corpus);
    return res;
}
