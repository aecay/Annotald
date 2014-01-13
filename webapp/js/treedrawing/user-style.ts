///<reference path="./../../../types/all.d.ts" />

/* tslint:disable:quotemark */

import $ = require("jquery");
import startup = require("./startup");

var globalStyle = $('<style type="text/css"></style>');

startup.addStartupHook(function () : void {
    globalStyle.appendTo("head");
});

startup.addShutdownHook(function () : void {
    globalStyle.remove();
    globalStyle = $('<style type="text/css"></style>');
});

function addStyle(str : string) : void {
    var style = globalStyle.text() + "\n" + str;
    globalStyle.text(style);
}

/**
 * Add a css style for a certain tag.
 *
 * @param {String} tagName The tag which to style.  Will match instances of
 * the given tag with additional trailing dash tags.
 * @param {String} css The css style declarations to associate with the tag.
 */
export function styleTag (tagName : string, css : string) : void {
    addStyle('*[class*=" ' + tagName + '-"],*[class*=" ' + tagName +
             ' "],*[class$=" ' + tagName + '"],[class*=" ' + tagName +
             '="] { ' + css + ' }');
}

export function styleIpNode(node : string) : void {
    styleTag(node, "border-top: 1px solid black;" +
             "border-bottom: 1px solid black;" +
             "background-color: #C5908E;");
}

/**
 * Add a css style for a certain dash tag.
 *
 * @param {String} tagName The tag which to style.  Will match any node with
 * this dash tag.  Should not itself have leading or trailing dashes.
 * @param {String} css The css style declarations to associate with the tag.
 */
export function styleDashTag(tagName : string, css : string) : void {
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
export function styleTags(tagNames : string[], css : string) : void {
    for (var i = 0; i < tagNames.length; i++) {
        styleTag(tagNames[i], css);
    }
};
