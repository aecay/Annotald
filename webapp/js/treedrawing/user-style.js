/*global exports: true, require: false */

/*jshint quotmark: false */

var $ = require("jquery"),
    startup = require("./startup");

var globalStyle = $('<style type="text/css"></style>');

startup.addStartupHook(function () {
    globalStyle.appendTo("head");
});

startup.addShutdownHook(function () {
    globalStyle.remove();
    globalStyle = $('<style type="text/css"></style>');
});

function addStyle(string) {
    var style = globalStyle.text() + "\n" + string;
    globalStyle.text(style);
}

/**
 * Add a css style for a certain tag.
 *
 * @param {String} tagName The tag which to style.  Will match instances of
 * the given tag with additional trailing dash tags.
 * @param {String} css The css style declarations to associate with the tag.
 */
function styleTag (tagName, css) {
    addStyle('*[class*=" ' + tagName + '-"],*[class*=" ' + tagName +
             ' "],*[class$=" ' + tagName + '"],[class*=" ' + tagName +
             '="] { ' + css + ' }');
}
exports.styleTag = styleTag;

exports.styleIpNode = function styleIpNode(node) {
    styleTag(node, "border-top: 1px solid black;" +
             "border-bottom: 1px solid black;" +
             "background-color: #C5908E;");
};

/**
 * Add a css style for a certain dash tag.
 *
 * @param {String} tagName The tag which to style.  Will match any node with
 * this dash tag.  Should not itself have leading or trailing dashes.
 * @param {String} css The css style declarations to associate with the tag.
 */
exports.styleDashTag = function styleDashTag(tagName, css) {
    addStyle('*[class*="-' + tagName + '-"],*[class*="-' + tagName +
             ' "],*[class$="-' + tagName + '"],[class*="-' + tagName +
             '="] { ' + css + ' }');
};

/**
 * A convenience function to wrap {@link styleTag}.
 *
 * @param {Array} tagNames Tags to style.
 * @param {String} css The css style declarations to associate with the tags.
 */
exports.styleTags = function styleTags(tagNames, css) {
    for (var i = 0; i < tagNames.length; i++) {
        styleTag(tagNames[i], css);
    }
};
