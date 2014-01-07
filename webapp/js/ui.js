/*global require: false, exports: true */

/*jshint browser: true, devel: true */

var React = require("react"),
    ConfigEditor = require("./ui-config").ConfigEditor,
    ConfigsList = require("./ui-config").ConfigsList,
    FileChooser = require("./ui-file").FileChooser,
    TreeEditor = require("./tree-editor").TreeEditor,
    $ = require("jquery");

// Idea: pass callback to child views.  They call the callback with a next
// view, which we then return in render.  This avoids children having to pass
// props for the next view on our state.

exports.AnnotaldUI = React.createClass({
    changeState: function (newState) {
        this.setState($.extend(this.state, newState));
    },
    getInitialState: function () {
        return {view: "welcome"};
    },
    render: function () {
        var that = this,
            pane;
        function fileChooserDone (content, path) {
            that.changeState({ view: "editTrees",
                               path: path,
                               content: content });
        }
        if (this.state.view === "welcome") {
            // TODO: this may be an awful hack.
            this.configList = ConfigsList({changeState: this.changeState});
            pane = React.DOM.div(
                {},
                React.DOM.h1({}, "Welcome to Annotald"),
                React.DOM.div({style: { width: "70%" }},
                              FileChooser({callback: fileChooserDone})),
                React.DOM.div({style: { width: "30%",
                                        float: "right" }},
                              this.configList));
        } else if (this.state.view === "editConfig") {
            pane = ConfigEditor({ changeState: this.changeState,
                                  name: this.state.name });
        } else if (this.state.view === "editTrees") {
            console.log($("#config-chooser").val());
            pane = TreeEditor({ path: this.state.path,
                                content: this.state.content,
                                // TODO: hackasaurus!!!
                                config: $("#config-chooser").val() });
        } else {
            pane = React.DOM.div({},
                                 "Unknown view: ",
                                 this.state.view);
        }
        return pane;
    }
});
