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

export function removeMetadata (node : Element, key : string, value : any = "")
: void {
    var metadata = getMetadata(node);
    metadata = setInDict(metadata, key, value, true);
    setNodeMetaAttr(node, metadata);
}

export function setMetadata (node : Element, key : string, value : any)
: void {
    var metadata = getMetadata(node);
    metadata = setInDict(metadata, key, value);
    setNodeMetaAttr(node, metadata);
}

export function getMetadata (node : Element)
: { [key: string] : any } {
    var attr = "data-metadata";
    return JSON.parse(node.getAttribute(attr)) || {};
}

function setNodeMetaAttr (node : Element, metadata : any)
: void {
    var attr = "data-metadata";
    if (!metadata || _.isEmpty(metadata)) {
        node.removeAttribute(attr);
    } else {
        node.setAttribute(attr, JSON.stringify(metadata));
    }
}

export function setMetadataXml (node : Element, key : string, value : any) : void {
    var mdNode = $(node).children("meta").first().get(0);
    if (!mdNode) {
        mdNode = node.ownerDocument.createElement("meta");
        $(node).prepend(mdNode);
    }
    setMetadataXmlInner(mdNode, key, value);
}

function setMetadataXmlInner (node : Element, key : string, value : any) : void {
    var c = $(node).children(key);
    if (c.length > 1) {
        throw new Error("setMetadataXmlInner: dupe key: " + key);
    } else if (c.length === 0) {
        var el = node.ownerDocument.createElement(key);
        node.appendChild(el);
        c = $(el);
    }
    if (_.isString(value)) {
        c.text(value);
    } else {
        _.forOwn(value, function (v : any, k : string) : void {
            setMetadataXmlInner(c.get(0), k, v);
        });
    }
}

export function removeMetadataXml (node : Element, key : string, value : any)
: void {
    var mdNode = $(node).children("meta").first().get(0);
    if (!mdNode) {
        mdNode = node.ownerDocument.createElement("meta");
        $(node).prepend(mdNode);
    }
    removeMetadataXmlInner(mdNode, key, value);
}

function removeMetadataXmlInner (node : Element, key : string, value : any) : void {
    var c = $(node).children(key);
    if (c.length > 1) {
        throw new Error("removeMetadataXmlInner: dupe key: " + key);
    } else if (c.length === 0) {
        return;
    }
    if (_.isString(value)) {
        c.remove();
    } else {
        _.forOwn(value, function (v : any, k : string) : void {
            removeMetadataXmlInner(c.get(0), k, v);
        });
        if ($(node).children().length === 0) {
            $(node).remove();
        }
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
