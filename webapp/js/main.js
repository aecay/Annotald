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
    _ = require("lodash"),
    bulk = require("bulk-require"),
    db = require("./db");
bulk(__dirname, ["**/*.ts", "!**/flymake_*"]);

cs.listConfigs().then(function (configs) {
    if (! _.contains(_.keys(configs), "default")) {
        return cs.setConfig("default", fs.readFileSync(
            __dirname + "/../assets/settings.js", "utf8"));
    }
    return undefined;
}).then(function () {
    return db.get("formats", {});
}).then(function (formats) {
    if (! _.contains(_.keys(formats), "icelandic")) {
        return db.setIn("formats", "icelandic", fs.readFileSync(
            __dirname + "/psd-grammars/icelandic-format.xml", "utf8"));
    }
    return undefined;
}).done(function () {
    $(function () {
        React.renderComponent(ui.AnnotaldUI(), document.getElementById("mainui"));
    });
});
