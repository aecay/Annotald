/*global require: false, exports: true */

/*jshint browser: true */

var React = require("react"),
    parser = require("../parse.ts"),
    lc = require("../treedrawing/label-convert.ts"),
    psdParser = require("../parse-psd.ts"),
    template = require("./tree-editor-template").template,
    $ = require("jquery"),
    configStore = require("../config-store"),
    treedrawing = require("../treedrawing/startup.ts"),
    Q = require("q"),
    db = require("../db");

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
            db.get("formats").then(function (fmts) {
                that.format = fmts[that.props.fmtName];
            }).then(function () {
                return that.props.file.read();
            }).then(
                function (content) {
                    if ($.trim(content).substr(0, 1) === "(") {
                        return psdParser.jsToXml(psdParser.parseCorpus(content),
                                                 lc.parseFormatSpec(that.format),
                                                 // TODO: make configurable
                                                 psdParser.corpusDefs.icepahc
                                                );
                    } else {
                        return content;
                    }
                }
            ).then(function (content) {
                var html = parser.parseXmlToHtml(content);
                $("#editpane").html(html);
            })]).done(function () {
                treedrawing.startupTreedrawing(that.exit,
                                               that.props.file.write.bind(
                                                   that.props.file),
                                               that.format);
            });
    }
});
