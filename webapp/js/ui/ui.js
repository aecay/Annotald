/*global require: false, exports: true, history: false */

/*jshint browser: true, devel: true */

var React = require("react"),
    ConfigEditor = require("./config").ConfigEditor,
    ConfigsList = require("./config").ConfigsList,
    FileChooser = require("./file").FileChooser,
    TreeEditor = require("./tree-editor").TreeEditor,
    $ = require("jquery"),
    DropboxFile = require("../file/dropbox.ts");

var WelcomeUI = React.createClass({
    render: function () {
        return React.DOM.div(
            {},
            React.DOM.h1({}, "Welcome to Annotald"),
            React.DOM.div(
                {style: { width: "70%" }},
                FileChooser({ callback:
                              function (file) {
                                  $(document).trigger("ChangeView",
                                                      { view: "EditTree",
                                                        file: file });
                              }})),
            React.DOM.div({style: { width: "30%",
                                    float: "right" }},
                          ConfigsList()));
    }
});

exports.AnnotaldUI = React.createClass({
    getInitialState: function () {
        return { view: WelcomeUI({}) };
    },
    render: function () {
        return this.state.view;
    },
    componentDidMount: function () {
        var that = this;
        $(document).on("ChangeView", function (event, params) {
            var view = params.view;
            delete params.view;
            that.changeView(view, params);
        });
    },
    componentWillMount: function () {
        var state = history.state;
        if (!state) {
            return;
        }
        var params = state.params;
        switch (state.view) {
        case "EditTree":
            if (!params.hasOwnProperty("file")) {
                switch (params.fileType) {
                case "Local":
                    state.view = "Welcome";
                    state.params = {};
                    break;
                case "Dropbox":
                    params.file = DropboxFile.DropboxFile(params.serialization);
                    delete params.fileType;
                    delete params.serialization;
                    break;
                }
            }
            break;
        }
        this.setState({ view: this.getView(state.view, state.params)});
    },
    getView: function (view, params) {
        switch (view) {
        case "Welcome":
            return WelcomeUI(params);
        case "EditTree":
            return  TreeEditor({ file: params.file,
                                 // TODO: hackasaurus!!!
                                 config: params.config || $("#config-chooser").val()
                               });
        case "EditConfig":
            return ConfigEditor({ name: params.name });
        default:
            return React.DOM.div("Don't know about view: " + view);
        }
    },

    changeView: function (view, params) {
        this.setState({ view: this.getView(view, params) });
        switch (view) {
        case "Welcome":
            history.replaceState({ view: "Welcome",
                                   params: params },
                              "Welcome",
                              "#welcome");
            break;
        case "EditTree":
            history.replaceState({ view: "EditTree",
                                   params: { fileType: params.file.fileType,
                                             serialization: params.file.serialize(),
                                             config: params.config
                                           }},
                              "Edit tree",
                              "#edit-tree");
            break;
        case "EditConfig":
            history.replaceState({ view: "EditConfig",
                                   params: params },
                                 "Edit config",
                                 "#edit-config");
            break;
        default:
            break;
        }
    }
});
