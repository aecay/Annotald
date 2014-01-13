/*global require: false, exports: true */

var React = require("react"),
    fileLocal = require("../file-local"),
    fileDropbox = require("../file-dropbox");

exports.FileChooser = React.createClass({
    open: function (module) {
        var that = this;
        return function () {
            module.readFile().then(function (result) {
                that.props.callback(result.content, result.path, module.writeFile);
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
                              onClick: this.open(fileLocal)},
                            "Local file")),
            React.DOM.li(
                {},
                React.DOM.a({ href: "#",
                              onClick: this.open(fileDropbox)},
                            "Dropbox file")));
    }
});
