/*global require: false, exports: true */
/*jshint: broswer: true */

var vex = require("vex");
vex.defaultOptions.className = "vex-theme-default";
vex.dialog = require("vex-dialog");

exports.parse = require("./parse");
exports.$ = require("jquery");

var ui = exports.ui = require("./ui");

var React = exports.React = require("react");

document.addEventListener("DOMContentLoaded", function () {
    React.renderComponent(ui.AnnotaldUI(), document.getElementById("mainui"));
});
// exports.$(
// exports.React.renderComponent(exports.ui.AnnotaldUI(),
//                               document.getElementById("mainui")));
