/*global require: false, exports: false */

var $ = require('jquery')
  , fs = require("q-io/fs");

exports.readFile =  function readFileNw () {
    var dialog = $('#fileInputDialog');
    dialog.trigger('click');
    var file = dialog[0].files[0]
      , path = file.path;
    return fs.readFile(path, { encoding: 'utf8' })
        .then(function (data) {
            return { data: data
                     , writeBack: function (dat) {
                         fs.writeFile(path, dat);
                     }};
        });
};
