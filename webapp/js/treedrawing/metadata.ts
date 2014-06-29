///<reference path="./../../../types/all.d.ts" />

/* tslint:disable:quotemark */

import compat = require("./../compat");

var $ = compat.$;
import _ = require("lodash");

function setInDict (dict : { [key: string] : any },
                    key : string, val : any, remove? : boolean)
: { [key: string] : any } {
    if (_.isString(val)) {
        if (remove) {
            /* tslint:disable:no-unused-expression */
            delete dict[key];
            /* tslint:enable:no-unused-expression */
        } else {
            dict[key] = val;
        }
    } else {
        _.forOwn(val, function (v : any, k : string) : void {
            var dk = dict[key];
            if (!_.isObject(dk)) {
                dk = {};
                dict[key] = {};
            }
            dict[key] = setInDict(dk, k, v, remove);
            if (_.isEmpty(dict[key])) {
                /* tslint:disable:no-unused-expression */
                delete dict[key];
                /* tslint:enable:no-unused-expression */
            }
        });
    }
    return dict;
}

function nodeToDict (node : Node) : any {
    var r : any = {};
    if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3) {
        return node.childNodes[0].nodeValue;
    }
    $(node).children().each(function () : void {
        r[this.getAttribute("data-tag")] = nodeToDict(this);
    });
    return r;
}

export function getMetadata (node : Element)
: any {
    var metaNode = $(node).children(".meta");
    if (metaNode.length === 0) {
        return {};
    }
    return nodeToDict(metaNode.get(0));
}

// TODO: remove code duplication

function findKeyXml (el: Element, k: string) : JQuery {
    return $(el).children(k);
}

function findKeyHtml (el: Element, k: string) : JQuery {
    return $(el).children().filter(function () : boolean {
        return this.getAttribute("data-tag") === k;
    });
}

export function setMetadataXml (node : Element, key : string, value : any) : void {
    var mdNode = $(node).children("meta").first().get(0);
    if (!mdNode) {
        mdNode = node.ownerDocument.createElement("meta");
        $(node).append(mdNode);
    }
    setMetadataInner(mdNode, key, value,
                     findKeyXml,
                     (el: Element, k: string) : JQuery => {
                         return $(el.ownerDocument.createElement(k));
                     });
}

export function setMetadata (node : Element, key : string, value : any)
: void {
    var metaNode = $(node).children(".meta");
    if (metaNode.length === 0) {
        metaNode = $('<div class="meta" data-tag="meta" />');
        $(node).append(metaNode);
    }
    setMetadataInner(metaNode.get(0), key, value,
                     findKeyHtml,
                     (el: Element, k: string) : JQuery => {
                         return $('<div class="meta" data-tag="' + k + '"/>');
                     });
}

function setMetadataInner (node : Element,
                           key : string,
                           value : any,
                           findKey : (el: Element, k: string) => JQuery,
                           makeNewMetaElement : (el: Element, k: string) => JQuery)
: void {
    var c = findKey(node, key);
    if (c.length > 1) {
        throw new Error("setMetadataXmlInner: dupe key: " + key);
    } else if (c.length === 0) {
        c = makeNewMetaElement(node, key);
        $(node).append(c);
    }
    if (_.isString(value)) {
        c.text(value);
    } else if (_.isObject(value)) {
        _.forEach(value, (val : any, k : string) : any => {
            setMetadataInner(c.get(0), k, val, findKey, makeNewMetaElement);
        });
    } else {
        throw new Error("unknown value for setMetadata: " + value);
    }
}

export function removeMetadata (node : Element, key : string, value : any = "")
: void {
    var metaNode = $(node).children(".meta").get(0);
    removeMetadataInner(metaNode, key, value, findKeyHtml);
}

export function removeMetadataXml (node : Element, key : string, value : any)
: void {
    var mdNode = $(node).children("meta").first().get(0);
    if (!mdNode) {
        return;
    }
    removeMetadataInner(mdNode, key, value, findKeyXml);
}

function removeMetadataInner (node : Element,
                              key : string,
                              value : any,
                              findKey : (el: Element, k: string) => JQuery)
: void {
    var c = findKey(node, key);
    if (c.length > 1) {
        throw new Error("removeMetadataXmlInner: dupe key: " + key);
    } else if (c.length === 0) {
        return;
    }
    if (_.isString(value)) {
        c.remove();
    } else if (_.isObject(value)) {
        _.forOwn(value, function (v : any, k : string) : void {
            removeMetadataInner(c.get(0), k, v, findKey);
        });
    } else {
        throw new Error("unknown value for removeMetadata: " + value);
    }
    if ($(node).children().length === 0) {
        $(node).remove();
    }
}

/* tslint:disable:variable-name */
export var __test__ : any = {};
/* tslint:enable:variable-name */

if (process.env.ENV === "test") {
    __test__ = {
        setInDict: setInDict
    };
}
