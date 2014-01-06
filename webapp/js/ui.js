/*global require: false, exports: true */

var React = require("react"),
    ConfigEditor = require("./ui-config").ConfigEditor,
    ConfigsList = require("./ui-config").ConfigsList,
    FileChooser = require("./ui-file").FileChooser,
    $ = require("jquery");

exports.AnnotaldUI = React.createClass({
    changeState: function (props) {
        this.setState($.extend(this.state, props));
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
            pane = React.DOM.div(
                {},
                React.DOM.h1({}, "Welcome to Annotald"),
                React.DOM.div({style: { width: "70%" }},
                              FileChooser({callback: fileChooserDone})),
                React.DOM.div({style: { width: "30%",
                                        float: "right" }},
                              ConfigsList({changeState: this.changeState})));
        } else if (this.state.view === "editConfig") {
            pane = ConfigEditor({ changeState: this.changeState,
                                  name: this.state.name });

        } else {
            pane = React.DOM.div({},
                                 "Unknown view: ",
                                 this.state.view);
        }
        return pane;
    }
});
