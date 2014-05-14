/*global require: false, exports: true, process: false */

var React = require("react"),
    fileDropbox = require("../file/dropbox.ts"),
    recent = require("../file/recent.ts"),
    file = require("../file/file.ts");

var fileLocal;

if (process.env.ENV === "node-webkit") {
    fileLocal = require("../file/nw-file.ts").NwFile;
} else {
    fileLocal = require("../file/local.ts").LocalFile;
}

var RecentFileItem = React.createClass({
    open: function (e) {
        e.preventDefault();
        this.props.callback(file.reconstituteFile(this.props.type,
                                                  this.props.params));
    },
    render: function () {
        return React.DOM.li(
            {},
            this.props.type,
            ": ",
            this.props.params.path || this.props.params.name,
            " ",
            React.DOM.a({
                onClick: this.open,
                href: "#"
            }, "open")
        );
    }
});


var RecentFileList = React.createClass({
    getInitialState: function () {
        return { files: [] };
    },
    componentWillMount: function () {
        var that = this;
        this.props.filesPromise.done(function (files) {
            that.setState({ files: files });
            that.forceUpdate();
        });
    },
    render: function () {
        var that = this;
        return React.DOM.ul.apply(null,
            [{}].concat(
                this.state.files.map(function (x) {
                    return RecentFileItem({
                        type: x.fileType,
                        params: x.params,
                        callback: that.props.callback
                    });
                })));
    }
});

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
        return React.DOM.div(
            {},
            React.DOM.ul(
                {},
                // TODO: deduce this automatically from registered file types
                this.fileChoice(fileLocal, "Local file"),
                this.fileChoice(fileDropbox.DropboxFile, "Dropbox file"),
                React.DOM.li({},
                             "Recent files:",
                             React.DOM.br({}),
                             RecentFileList({
                                 filesPromise: recent.getRecentFiles(),
                                 callback: this.props.callback
                             })))
        );
    }
});
