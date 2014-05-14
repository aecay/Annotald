/*global require: false, exports: true */

/*jshint browser: true */

var React = require("react"),
    parser = require("../parse"),
    template = require("./tree-editor-template").template,
    $ = require("jquery"),
    configStore = require("../config-store"),
    treedrawing = require("../treedrawing/startup.ts"),
    Q = require("q");

exports.TreeEditor = React.createClass({
    exit: function () {
        $(document).trigger("ChangeView", { view: "Welcome" });
    },
    render: function () {
        return template;
    },
    componentDidMount: function () {
        var that = this;
        Q.all([
            configStore.getConfig(this.props.config).then(function (result) {
                var script = $("<script></script>");
                script.text(result);
                script.appendTo("head");
            }),
            this.props.file.read().then(function (content) {
                var html = parser.parseXmlToHtml(content);
                $("#editpane").html(html);
            })]).done(function () {
                treedrawing.startupTreedrawing(that.exit,
                                               that.props.file.write.bind(
                                                   that.props.file));
            });
    }
});
