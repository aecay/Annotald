/*global require: false, exports: true */

var React = require("react"),
    fileLocal = require("../file/local.ts"),
    fileDropbox = require("../file/dropbox.ts");

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
            this.fileChoice(fileLocal.LocalFile, "Local file"),
            this.fileChoice(fileDropbox.DropboxFile, "Dropbox file"));
    }
});
