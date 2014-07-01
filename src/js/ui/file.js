/*global require: false, exports: true, process: false, window: false, Blob: false */

var React = require("react"),
    // fileDropbox = require("../file/dropbox.ts"),
    // fileIcepahc = require("../file/icepahc.ts").IcepahcFile,
    // recent = require("../file/recent.ts"),
    file = require("../file/file.ts"),
    _ = require("lodash"),
    Q = require("q");

var fileLocal;

if (process.env.ENV === "node-webkit") {
    fileLocal = require("../file/nw-file.ts").NwFile;
} else {
    var local = require("../file/local.ts");
    fileLocal = local.LocalFile;
}

var LocalFileList = React.createClass({
    objectUrls: [],
    getInitialState: function () {
        return { children: [] };
    },
    render: function () {
        return React.DOM.ul.apply(null, [{}].concat(this.state.children));
    },
    componentDidMount: function () {
        this.updateFiles();
    },
    updateFiles: function () {
        var that = this;
        local.listFiles().then(function (fileNames) {
            return Q.all(_.map(fileNames, that.fileItem));
        }).done(function (items) {
            // It's ugly to do it this way; ideally we'd set the children to a
            // list of strings.  But we do it this way because we need to
            // operate async'ly on the contents of the strings.  Maybe a
            // better way would be to set the state to strings, have a
            // callback which sets a property of this and then forces an
            // update (????)
            that.setState({ children: items });
        });
    },
    fileItem: function (name) {
        var that = this;
        return local.readFile(name).then(function (contents) {
            var url = window.URL.createObjectURL(new Blob([contents]));
            that.objectUrls.push(url);
            return React.DOM.li(
                {},
                name, " – ",
                React.DOM.a(
                    { href: "#",
                      onClick : that.open.bind(that, name) },
                    "open"
                ), " – ",
                React.DOM.a(
                    { href: "#",
                      onClick : that.del.bind(that, name) },
                    "delete"
                ), " – ",
                React.DOM.a(
                    { href: url,
                      download: name + ".psdx" },
                    "download"
                )
            );
        });
    },
    open: function (name, e) {
        e.preventDefault();
        this.props.callback(file.reconstituteFile("Local",
                                                  { name: name }));
    },
    del: function (name, e) {
        var that = this;
        e.preventDefault();
        local.deleteFile(name).then(function () {
            that.updateFiles();
        }).done();
    },
    componentWillUnmount: function () {
        _.map(this.objectUrls, function (url) {
            // TODO: remove this debug code
            console.log("revoking: " + url);
            window.URL.revokeObjectURL(url);
        });
    }
});

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
                // this.fileChoice(fileIcepahc, "IcePaHC file"),
                // TODO: fucking SSL, me cago en su puta madre
                // this.fileChoice(fileDropbox.DropboxFile, "Dropbox file"),
                // TODO: useless until we have more interesting file choices
                // than just local
                // React.DOM.li({},
                //              "Recent files:",
                //              React.DOM.br({}),
                //              RecentFileList({
                //                  filesPromise: recent.getRecentFiles(),
                //                  callback: this.props.callback
                //              })),
                // TODO: not under node-webkit
                React.DOM.li({},
                             "Local files:",
                             React.DOM.br({}),
                             LocalFileList({ callback: this.props.callback }))
            )
        );
    }
});
