/*global define: false */

define(["require", "jquery"], function (require, $) {
    var fs = require("fs");
    return {
        chooseFile: function () {
            var dialog = $('#fileInputDialog');
            dialog.trigger('click');
            var files = dialog[0].files;
            return files[0].path;
        },
        writeFile: function (path, data) {
            fs.writeFileSync(path, data);
        }
    };
});
