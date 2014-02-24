/*global require: false, __dirname: false */
/*jshint browser: true */

var vex = require("vex");
vex.defaultOptions.className = "vex-theme-default";
vex.dialog = require("vex-dialog");

var ui = require("./ui/ui"),
    React = require("react"),
    cs = require("./config-store"),
    $ = require("jquery"),
    fs = require("fs"),
    _ = require("lodash");

cs.listConfigs().then(function (configs) {
    // TODO: this doesn't finish in time for the config to actually show up on
    // the first run; the menu will be empty
    if (! _.contains(_.keys(configs), "default")) {
        return cs.setConfig("default", fs.readFileSync(
            __dirname + "/../assets/settings.js"));
    }
    return undefined;
}).then(function () {
    $(function () {
        React.renderComponent(ui.AnnotaldUI(), document.getElementById("mainui"));
    });
}).catch(function (e) {
    console.log(e.stack);
});
