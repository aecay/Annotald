///<reference path="./../types/all.d.ts" />

require("typescript-require");
import parsePsd = require("./../src/js/parse-psd");
import lc = require("./../src/js/treedrawing/label-convert");

var data = "";

process.stdin.on("readable", function() : void {
    var chunk = process.stdin.read();
    if (chunk !== null) {
        data += chunk;
    }
});

process.stdin.on("end", function() : void {
    var trees = data.split("\n\n");
    for (var i = 0; i < trees.length; i++) {
        try {
            parsePsd.parseCorpus(trees[i]);
        } catch (e) {
            process.stdout.write("Bad tree: \n");
            process.stdout.write(trees[i]);
            process.stdout.write("\n");
            process.stdout.write(e.message);
            process.stdout.write("\n-----\n");
        }
    }
});
