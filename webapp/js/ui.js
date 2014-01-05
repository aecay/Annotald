/** @jsx React.DOM */

/*global require: false, exports: true */

var React = require("react"),
    config_store = require("./config-store"),
    ConfigEditor = require("./ui-config").ConfigEditor,
    ConfigsList = require("./ui-config").ConfigsList,
    $ = require("jquery");

exports.AnnotaldUI = React.createClass({
    changeState: function (props) {
        this.setState($.extend(this.state, props));
    },
    getInitialState: function () {
        return {view: "welcome"};
    },
    render: function () {
        var pane;
        if (this.state.view === 'welcome') {
            pane = <ConfigsList changeState={this.changeState} />;
        } else if (this.state.view === "editConfig") {
            pane = <ConfigEditor
            changeState={this.changeState}
            name = {this.state.name} />;

        }
        return <div>
            <h1>Welcome to Annotald</h1>
            {pane}
            </div>;
    }
});
