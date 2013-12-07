/*global require: false, FileReader: false, exports: false */

var $ = require('jquery')
  , Q = require ("q");

function writeBackFileWeb (data) {
    window.open('data:text/plain,' + encodeURIComponent(data));
    return Q.deferred().resolve(true);
}
exports.readFile = function readFileWeb () {
    var dialog = $('#fileInputDialog')
      , deferred = Q.defer();
    // doesn't work, will need to show the input in a dialog and use onchange?
    dialog.trigger('click');
    var file = dialog[0].files[0]
      , fr = new FileReader();
    fr.onload = function () {
        deferred.fulfill({ content: file[0]
                          , writeBack: writeBackFileWeb });
    };
    fr.readAsText(file);
    return deferred.promise;
};
