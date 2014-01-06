/*global require: false, FileReader: false, exports: false */

var $ = require('jquery'),
    Q = require ("q"),
    vex = require("vex");

var saveMsg = "A new tab will open with the contents of the parsed file;" +
        " please use the browser's \"Save As\" feature to save" +
        " the contents of the tab";

exports.writeFile = function writeFileLocal (path, content) {
    var deferred = Q.defer();
    vex.dialog.alert({ message: (saveMsg +
                                 (path ? " to the file '" + path + "'" : "") +
                                 "."),
                       callback: function () {
                           window.open('data:text/plain,' + encodeURIComponent(content));
                           deferred.resolve(true);
                       }});
    return deferred.promise;
};

exports.readFile = function readFileLocal (path) {
    if (path !== undefined && path) {
        throw "cannot pass a path to web.readFile";
    }
    var deferred = Q.defer();
    vex.dialog.open({ message: "Please choose a file",
                      input: '<div class="vex-custom-field-wrapper"><label' +
                      ' for="file">File</label><div' +
                      ' class="vex-custom-input-wrapper"><input name="file"' +
                      ' type="file" id="local-file-input"/></div></div>',
                      callback: function (data) {
                          var file = document.getElementById("local-file-input").files[0],
                              fr = new FileReader();
                          fr.onload = function (event) {
                              deferred.fulfill({ content: event.target.result });
                          };
                          // TODO: error handling
                          fr.readAsText(file);
                          return deferred.promise;
                      },
                      buttons: [{text: "OK", type: "submit"}]});
    return deferred.promise;
};
