///<reference path="./../../types/all.d.ts" />

import compat = require("./compat");

var $ = compat.$;

function makeWnode (xmlNode : Node) : Node {
    var wnode = document.createElement("span");
    var tn = document.createTextNode(xmlNode.textContent);
    wnode.className = "wnode";
    wnode.appendChild(tn);
    return wnode;
}

function metaXmlToHtml(node : Element) : Element {
    var r = document.createElement("div");
    r.setAttribute("data-tag", node.tagName);
    r.setAttribute("class", "meta");
    if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3) {
        var t = document.createTextNode(node.childNodes[0].textContent);
        r.appendChild(t);
    } else {
        $(node).children().each(function () : void {
            r.appendChild(metaXmlToHtml(this));
        });
    }
    return r;
}

function makeSnode (xmlNode : Element) : Node {
    var snode = document.createElement("div");
    var cn = xmlNode.childNodes;
    var atts = xmlNode.attributes;
    var c, a, i;
    if (xmlNode.tagName === "sentence") {
        snode.className = "sentnode";
    } else {
        snode.className = "snode";
    }
    if (cn.length === 0) {
        // terminal node with no text: trace or ec
        snode.setAttribute("data-nodetype", xmlNode.nodeName);
    } else {
        for (i = 0; i < cn.length; i++) {
            c = cn[i];
            if (c.nodeType === 3 && c.textContent.trim() !== "") {
                snode.appendChild(makeWnode(c));
                snode.setAttribute("data-nodetype", xmlNode.nodeName);
            } else if (c.nodeType === 1) {
                if (c.tagName === "meta") {
                    snode.appendChild(metaXmlToHtml(c));
                } else {
                    snode.appendChild(makeSnode(c));
                }
            }
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
    return $(node).children(".wnode").contents().filter(function () : boolean {
        return this.nodeType === 3;
    }).first().text();
}

function nodeToXml (doc : Document, node : HTMLElement) : Node {
    var name, i, recurse = true, isMeta = false;
    if (node.classList.contains("sentnode")) {
        name = "sentence";
    } else if (node.classList.contains("meta")) {
        name = node.getAttribute("data-tag");
        if (node.childNodes.length === 1 &&
            node.childNodes[0].nodeType === 3) {
            recurse = false;
            isMeta = true;
        }
    } else {
        var nonMetaChildren = $(node).children().not(".meta");
        if (nonMetaChildren.length === 1 &&
            nonMetaChildren.first().hasClass("wnode")) {
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
        if (attr.name === "data-nodetype" ||
            attr.name === "data-tag") {
            // do nothing; this case is already handled
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
        var tn : Text;
        if (isMeta) {
            tn = doc.createTextNode(node.childNodes[0].textContent);
            s.appendChild(tn);
        } else if (name === "text") {
            tn = doc.createTextNode(terminalNodeToString(<HTMLElement>node));
            s.appendChild(tn);
        }
        var mc = $(node).children(".meta");
        if (mc.length === 1) {
            // Special case: recurse for the metadata
            s.appendChild(nodeToXml(doc, mc.get(0)));
        } else if (mc.length > 1) {
            throw new Error("Too many meta-class elements");
        }
    }
    return s;
}

export function parseHtmlToXml (node : Node) : string {
    var doc = document.implementation.createDocument("foo", "", null);
    var corpus = document.createElementNS("foo", "corpus");
    doc.appendChild(corpus);
    $(node).children().each(function () : void {
        corpus.appendChild(nodeToXml(doc, this));
    });
    return (new XMLSerializer).serializeToString(doc).replace(/ xmlns="foo"/, "");
};
