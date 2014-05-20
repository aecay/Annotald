/*global require: false, console: false, module: true */
// type(script)ify v 0.1.0, author Andrew Gaspar, license MIT
// Modified by Aaron Ecay

var through = require("through");
var fs = require("fs");
var childproc = require("child_process");
var path = require("path");

function compile(file, data, cb) {
    if (!isTypescript(file)) {
        cb(new Error("Not a typescript file"));
        return;
    }

    var fileName = path.basename(file, ".ts");
    var dir = path.dirname(file);
    console.log("compiling: " + file);

    childproc.exec("tsc -m commonjs " + file,
                   { encoding: "utf8" },
                   function (error, stdout, stderr) {
                       if ((stdout && stdout.length > 0) ||
                           (stderr && stderr.length > 0)) {
                           cb(new Error("Could not compile typescript file: " +
                                        file + "\n" + stdout.toString() +
                                        "\n" + stderr.toString()));
                           return;
                       } else {
                           fs.readFile(path.join(dir, fileName + ".js"),
                                       { encoding: "utf8" },
                                       function (err, originalText) {
                                           cb(err, originalText);
                                       });
                       }
    });
}

function isTypescript(file) {
    return /\.ts$/.test(file);
}

function typeify(file) {
    console.log("candidate: " + file);
    var candidateReplacement = file.replace(/\.js$/, ".ts");
    if (fs.existsSync(candidateReplacement)) {
        file = candidateReplacement;
        console.log("replaced with " + file);
    }
    if (!isTypescript(file)){
        return through();
    }

    var data = "";
    return through(write, end);

    function write(buf) {
        data += buf;
    }
    function end() {
        var _this = this;
        compile(file, data, function (err, data) {
            if (err) {
                _this.emit("error", err);
            }
            _this.queue(data);
            _this.queue(null);
        });
    }
}

module.exports = typeify;
