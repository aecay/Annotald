///<reference path="./../../types/all.d.ts" />

var JQ = require("jquery");
var nodeUtils = require("./node-utils");

var utilWindow : Window;

export function getWindow () : Window {
    if (typeof window === "undefined") {
        var jsdom = nodeUtils.jsdom;
        var document = jsdom.jsdom(
            "<html><head></head><body>hello world</body></html>");
        utilWindow = document.createWindow();
        return utilWindow;
    } else {
        return window;
    }
}

export function getDocument () : Document {
    return getWindow().document;
}

export var $ : JQueryStatic;
// TODO: why this mad inconsistency???
if (typeof window === "undefined") {
    $ = JQ(getWindow());
} else {
    $ = JQ;
}

/* tslint:disable:variable-name */
export var XmlSerializer : XMLSerializer;
/* tslint:enable:variable-name */

if (typeof XMLSerializer === "undefined") {
    XmlSerializer = new (nodeUtils.xmldom.XMLSerializer)();
} else {
    XmlSerializer = new XMLSerializer();
}
