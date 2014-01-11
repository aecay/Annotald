/*global require: false, exports: true */

// These come from Annotald's undifferentiated pile
/*global documentReadyHandler: false */

/*jshint browser: true */

var React = require("react"),
    parser = require("../parse"),
    template = require("./tree-editor-template").template,
    $ = require("jquery"),
    configStore = require("../config-store");

exports.TreeEditor = React.createClass({
    exit: function () {
        // TODO: check for unsaved changes
        // TODO: remove event handlers
        // this.props.changeState({view: "welcome"});
    },
    render: function () {
        return template;
    },
    componentDidMount: function () {
        configStore.getConfig(this.props.config).then(function (result) {
            var script = $("<script></script>");
            script.text(result);
            script.appendTo("head");
            documentReadyHandler();
        });
        var html = parser.parseXmlToHtml(this.props.content);
        $("#editpane").html(html);
    }
});
