/*global require: false, exports: true */

var React = require("react"),
    fileLocal = require("../file-local"),
    fileDropbox = require("../file-dropbox");

exports.FileChooser = React.createClass({
    open: function (readFn) {
        var that = this;
        return function () {
            readFn().then(function (result) {
                that.props.callback(result.content, result.path);
            });
            return false;
        };
    },
    render: function () {
        return React.DOM.ul(
            {},
            React.DOM.li(
                {},
                React.DOM.a({ href: "#",
                              onClick: this.open(fileLocal.readFile)},
                            "Local file")),
            React.DOM.li(
                {},
                React.DOM.a({ href: "#",
                              onClick: this.open(fileDropbox.readFile)},
                            "Dropbox file")));
    }
});
