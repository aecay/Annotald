/*global require: false, FileReader: false, exports: false */

var $ = require('jquery')
, Q = require ("q")
, vex = require("vex");

vex.defaultOptions.className = 'vex-theme-default';

exports.writeFile = function writeFileLocal (path, content) {
    var deferred = Q.defer()
    , alt = vex.alert({ message: "A new tab will open with the contents of the parsed file;"
                      + " please use the browser's \"Save As\" feature to save"
                      + " the contents of the tab to the file \"" + path + "\"",
                      callback: function () {
                          window.open('data:text/plain,' + encodeURIComponent(content));
                          deferred.resolve(true);
                      } });
    return deferred.promise;
};

exports.readFile = function readFileLocal (path) {
    if (path !== undefined) {
        throw "cannot pass a path to web.readFile";
    }
    var dialog = $('#fileInputDialog')
      , deferred = Q.defer();
    // doesn't work, will need to show the input in a dialog and use onchange?
    dialog.trigger('click');
    var file = dialog[0].files[0]
      , fr = new FileReader();
    fr.onload = function (event) {
        deferred.fulfill(event.target.result);
    };
    fr.readAsText(file);
    return deferred.promise;
};
