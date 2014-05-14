/*global require: false, exports: true, process: false */

var React = require("react"),
    fileDropbox = require("../file/dropbox.ts"),
    fileLocal;

if (process.env.ENV === "node-webkit") {
    fileLocal = require("../file/nw-file.ts").NwFile;
} else {
    fileLocal = require("../file/local.ts").LocalFile;
}

exports.FileChooser = React.createClass({
    open: function (module) {
        var that = this;
        return function () {
            module.prompt().then(function (result) {
                that.props.callback(result);
            });
            return false;
        };
    },
    fileChoice: function (module, name) {
        return React.DOM.li(
            {},
            React.DOM.a({ href: "#",
                          onClick: this.open(module)},
                        name));
    },
    render: function () {
        return React.DOM.ul(
            {},
            this.fileChoice(fileLocal, "Local file"),
            this.fileChoice(fileDropbox.DropboxFile, "Dropbox file"));
    }
});
