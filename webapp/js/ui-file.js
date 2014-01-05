/** @jsx React.DOM */

/*global require: false, exports: true */

var React = require("react"),
    file_local = require("./file-local"),
    file_dropbox = require("./file-dropbox");

exports.FileChooser = React.createClass({
    open: function (readFn) {
        var that = this;
        return function () {
            readFn().then(function (result) {
                that.props.changeState({ view: "editTrees",
                                         path: result.path,
                                         content: result.content });
            });
            return false;
        };
    },
    render: function () {
        return <ul>
            <li><a href="#" onClick={this.open(file_local.readFile)}>Local file</a></li>
            <li><a href="#" onClick={this.open(file_dropbox.readFile)}>Dropbox file</a></li>
            </ul>;
    }
});
