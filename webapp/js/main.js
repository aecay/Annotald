/*global require: false */
/*jshint browser: true */

var vex = require("vex");
vex.defaultOptions.className = "vex-theme-default";
vex.dialog = require("vex-dialog");

var ui = require("./ui/ui");

var React = require("react");

document.addEventListener("DOMContentLoaded", function () {
    React.renderComponent(ui.AnnotaldUI(), document.getElementById("mainui"));
});
