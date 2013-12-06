/*global require: false, FileReader: false, exports: false */

var $ = require('jquery')
  , Q = require ("q");

function writeBackFileWeb (data) {
    window.open('data:text/plain,' + encodeURIComponent(data));
    return Q.deferred().resolve(true);
}
exports.readFile = function readFileWeb () {
    var dialog = $('#fileInputDialog')
      , promise = Q.deferred();
    dialog.trigger('click');
    var file = dialog[0].files[0]
      , fr = new FileReader();
    fr.onload = function () {
        promise.resolve({ content: file[0]
                          , writeBack: writeBackFileWeb });
    };
    fr.readAsText(file);
    return promise;
};
