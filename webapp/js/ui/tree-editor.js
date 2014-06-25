/*global require: false, exports: true */

/*jshint browser: true */

var React = require("react"),
    parser = require("../parse.ts"),
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
            this.props.file.read().then(function (content) {
                if ($.trim(content).substr(0, 1) === "(") {
                    // old-format PSD file
                    return db.get("formats").then(function (fmts) {
                        return fmts[that.props.fmtName];
                    }).then(function (format) {
                        return psdParser.jsToXml(psdParser.parseCorpus(content),
                                                 parser.parseFormatSpec(format),
                                                 // TODO
                                                 psdParser.corpusDefs.icepahc
                                                );
                    });
                } else {
                    return content;
                }
            }).then(function (content) {
                var html = parser.parseXmlToHtml(content);
                $("#editpane").html(html);
            })]).done(function () {
                treedrawing.startupTreedrawing(that.exit,
                                               that.props.file.write.bind(
                                                   that.props.file));
            });
    }
});
