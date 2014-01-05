/** @jsx React.DOM */

/*global require: false, exports: true */

var React = require("react"),
    config_store = require("./config-store"),
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
        var pane;
        if (this.state.view === 'welcome') {
            pane = <div>
                     <h1>Welcome to Annotald</h1>
                     <div style={{width: "70%"}}>
                       <FileChooser changeState={this.changeState}/>
                     </div>
                     <div style={{width: "30%", float: "right"}}>
                       <ConfigsList changeState={this.changeState} />
                     </div>
                   </div>;
        } else if (this.state.view === "editConfig") {
            pane = <ConfigEditor
            changeState={this.changeState}
            name = {this.state.name} />;

        } else {
            pane = <div>Unknown view: {this.state.view}</div>;
        }
        return pane;
    }
});
