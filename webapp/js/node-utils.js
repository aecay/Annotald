/*global require: false, exports: true */

// We need this because of a bug in the grunt-browserify package, whereby it's
// not possible to pass the "ignore" option containing the names of non-files,
// such as the below modules.  So, browserify bogusly pulls them into the
// borwser bundle.  We can ignore this file, though, which we do.

exports.jsdom = require("jsdom");
exports.xmldom = require("xmldom");
