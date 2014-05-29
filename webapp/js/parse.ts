///<reference path="./../../types/all.d.ts" />

import $ = require("jquery");
import _ = require("lodash");

import lc = require("./treedrawing/label-convert");

export var __test__ : any = {};

function nodeToAction (n : JQuery) : any {
    var r = {};
    if (n.children().length === 0) {
        r[n.prop("tagName").toLowerCase()] = n.text();
    } else {
        var m = n.children().map(function () : any {
            return nodeToAction($(this));
        }).get();
        m.unshift({});
        r[n.prop("tagName").toLowerCase()] = _.merge.apply(null, m);
    }
    return r;

}
__test__.nodeToAction = nodeToAction;

function parseFormatSpec (root : Element) : lc.LabelMap {
    var r : lc.LabelMap = {
        defaults: {},
        defaultSubcategories: [],
        byLabel: {}
    };
    var $root = $(root);
    $root.children("dashTags").first().children().each(function () : void {
        var y = $(this);
        var dashTagName = y.prop("tagName");
        var metadata = y.children().first();
        r.defaults[dashTagName] = nodeToAction(metadata);
    });
    $root.children("subcategories").first().children().each(function () : void {
        r.defaultSubcategories.push(this.tagName);
    });
    $root.children("byLabel").first().children().each(function () : void {
        var x = parseFormatSpec(this);
        // TODO: the mismatch here is ugly...
        r.byLabel[this.tagName] = {
            subcategories: x.defaultSubcategories,
            metadataKeys: x.defaults
        };
    });
    return r;
}
__test__.parseFormatSpec = parseFormatSpec;

function makeWnode (xmlNode : Node) : Node {
    var wnode = document.createElement("span");
    var tn = document.createTextNode(xmlNode.textContent);
    wnode.className = "wnode";
    wnode.appendChild(tn);
    return wnode;
}

function makeSnode (xmlNode : Node) : Node {
    var snode = document.createElement("div");
    var cn = xmlNode.childNodes;
    var atts = xmlNode.attributes;
    var c, a, i;
    snode.className = "snode";
    for (i = 0; i < cn.length; i++) {
        c = cn[i];
        if (c.nodeType === 3 && c.textContent.trim() !== "") {
            snode.appendChild(makeWnode(c));
            snode.setAttribute("data-nodetype", xmlNode.nodeName);
        } else if (c.nodeType === 1) {
            snode.appendChild(makeSnode(c));
        }
    }
    for (i = 0; i < atts.length; i++) {
        a = atts[i];
        snode.setAttribute("data-" + a.nodeName, a.nodeValue);
    }
    return snode;
}

export function parseXmlToHtml (xml : string) : Node {
    var dom = new DOMParser().parseFromString(xml, "text/xml"),
        sn0 = document.createElement("div"),
        rootElement = dom.childNodes[0],
        cn =  rootElement.childNodes,
        c;
    sn0.className = "snode";
    sn0.id = "sn0";
    for (var i = 0; i < cn.length; i++) {
        c = cn[i];
        if (c.nodeType === 1) {
            sn0.appendChild(makeSnode(c));
        }
    }
    // TODO: global attributes
    return sn0;
};

function terminalNodeToString (node : HTMLElement) : string {
    var wnode;
    for (var i = 0; i < node.children.length; i++) {
        if (node.children[i].nodeType === 1 &&
            (<HTMLElement>node.children[i]).classList.contains("wnode")) {
            wnode = node.children[i];
            break;
        }
    }
    return wnode.textContent;
}

function nodeToXml (doc : Document, node : HTMLElement, root? : boolean) : Node {
    var name, i, recurse = true;
    if (root) {
        name = "sentence";
    } else {
        if (node.children.length === 1 &&
            (<HTMLElement>node.children[0]).classList.contains("wnode")) {
            // Terminal
            name = node.attributes["data-nodetype"].value;
            recurse = false;
        } else {
            // Text node
            name = "nonterminal";
        }
    }
    var s = doc.createElement(name),
        attrs = node.attributes;
    for (i = 0; i < attrs.length; i++) {
        var attr = attrs[i];
        if (attr.name === "data-metadata") {
            // TODO: handle metadata
        } else if (attr.name === "data-nodetype") {
            // do nothing
        } else if (/^data-/.test(attr.name)) {
            s.setAttribute(attrs[i].name.replace(/^data-/, ""),
                           attrs[i].value);
        }
    }
    if (recurse) {
        for (i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType === 1) {
                // Element node
                s.appendChild(nodeToXml(doc, <HTMLElement>node.childNodes[i]));
            }
        }
    } else {
        var tn = doc.createTextNode(terminalNodeToString(<HTMLElement>node));
        s.appendChild(tn);
    }
    return s;
}

export function parseHtmlToXml (node : Node) : string {
    var doc = document.implementation.createDocument("foo", "", null);
    var corpus = document.createElementNS("foo", "corpus");
    doc.appendChild(corpus);
    $(node).children().each(function () : void {
        corpus.appendChild(nodeToXml(doc, this, true));
    });
    return (new XMLSerializer).serializeToString(doc).replace(/ xmlns="foo"/, "");
};
